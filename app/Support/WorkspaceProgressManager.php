<?php

namespace App\Support;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\ModuleContent;
use App\Models\ModuleStage;
use App\Models\ModuleStageProgress;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizResult;
use App\Models\User;
use App\Support\Enums\ModuleStageProgressStatus;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

class WorkspaceProgressManager {
    /**
     * @var array<int, array<string, mixed>>
     */
    private array $overviewCache = [];

    /**
     * @throws AuthorizationException
     */
    public function getEnrollmentFor(User $user, Course $course): Enrollment {
        $enrollment = $course
            ->enrollments()
            ->where('user_id', $user->getKey())
            ->first();

        if (!$enrollment) {
            throw new AuthorizationException('Anda belum terdaftar pada kursus ini.');
        }

        return $enrollment;
    }

    public function canAccessStage(Enrollment $enrollment, ModuleStage $stage): bool {
        $overview = $this->buildOverview($enrollment);
        $summary = $overview['stage_summaries'][$stage->getKey()] ?? null;

        if ($summary === null) {
            return false;
        }

        return $summary['locked'] === false;
    }

    public function forgetOverview(Enrollment $enrollment): void {
        unset($this->overviewCache[$enrollment->getKey()]);
    }

    public function enrollmentHasMetCertificateRequirements(Enrollment $enrollment): bool {
        $overview = $this->buildOverview($enrollment);
        $certificate = Arr::get($overview, 'stats.certificate');

        if (!is_array($certificate)) {
            return true;
        }

        $requiredPoints = (int) ($certificate['required_points'] ?? 0);

        if ($requiredPoints <= 0) {
            return true;
        }

        $quizPoints = Arr::get($overview, 'stats.quiz_points');
        $earnedPoints = is_array($quizPoints) ? (int) ($quizPoints['earned'] ?? 0) : 0;

        return $earnedPoints >= $requiredPoints;
    }

    /**
     * @return array<string, mixed>
     */
    public function buildOverview(Enrollment $enrollment): array {
        $cacheKey = $enrollment->getKey();

        if (isset($this->overviewCache[$cacheKey])) {
            return $this->overviewCache[$cacheKey];
        }

        $course = $enrollment
            ->course()
            ->with([
                'modules' => static function ($query): void {
                    $query->orderBy('order')->orderBy('id');
                },
                'modules.module_stages' => static function ($query): void {
                    $query->orderBy('order')->orderBy('id');
                },
                'modules.module_stages.module_content',
                'modules.module_stages.module_quiz' => static function ($query): void {
                    $query->withCount('quiz_questions');
                },
            ])
            ->firstOrFail();

        $totalQuizPoints = $course->totalQuizPoints();
        $requiredQuizPoints = $course->certificateRequiredPointsEffective($totalQuizPoints);

        /** @var \Illuminate\Support\Collection<int, ModuleStageProgress> $progressRecords */
        $progressRecords = $enrollment
            ->module_stage_progresses()
            ->with('quiz_result')
            ->get()
            ->keyBy(static fn (ModuleStageProgress $progress): int => $progress->module_stage_id);

        $quizAttempts = QuizResult::query()
            ->selectRaw('quiz_id, MAX(attempt) as max_attempt')
            ->where('user_id', $enrollment->user_id)
            ->groupBy('quiz_id')
            ->pluck('max_attempt', 'quiz_id')
            ->map(static fn ($value) => (int) $value)
            ->all();

        $modules = [];
        $stageSummaries = [];

        $completedStages = 0;
        $totalStages = 0;
        $earnedQuizPoints = 0;
        $currentStageId = null;
        $previousModulesCompleted = true;

        /** @var Module $module */
        foreach ($course->modules as $module) {
            $moduleStagesData = [];
            $moduleCompleted = true;
            $moduleStageCount = 0;
            $moduleCompletedCount = 0;
            $moduleLocked = !$previousModulesCompleted;
            $previousStageCompleted = true;

            /** @var ModuleStage $stage */
            foreach ($module->module_stages as $stage) {
                $moduleStageCount++;
                $totalStages++;

                $progress = $progressRecords->get($stage->getKey());
                $status = $progress?->status ?? ModuleStageProgressStatus::Pending->value;
                $statusEnum = ModuleStageProgressStatus::from($status);
                $isCompleted = $statusEnum === ModuleStageProgressStatus::Completed;

                $stageTotalPoints = $stage->module_able === 'quiz'
                    ? $this->calculateStageTotalPoints($stage)
                    : 0;

                if ($stage->module_able === 'quiz') {
                    $earned = max(0, (int) ($progress?->quiz_result?->earned_points ?? 0));
                    $earnedQuizPoints += min($stageTotalPoints, $earned);
                }

                if ($isCompleted) {
                    $completedStages++;
                    $moduleCompletedCount++;
                }

                $isLocked = $moduleLocked || !$previousStageCompleted;
                if ($isCompleted) {
                    $isLocked = false;
                }

                $timeline = $this->resolveTimeline($stage, $progress);

                $durationMinutes = $this->resolveStageDuration($stage);
                $stageTitle = $this->resolveStageTitle($stage);
                $stageDescription = $this->resolveStageDescription($stage);

                $attemptNumber = $this->resolveAttemptNumber($stage, $progress, $quizAttempts);

                if ($attemptNumber !== null && $stage->module_quiz) {
                    $quizId = $stage->module_quiz->getKey();
                    $currentMax = (int) ($quizAttempts[$quizId] ?? 0);
                    if ($attemptNumber > $currentMax) {
                        $quizAttempts[$quizId] = $attemptNumber;
                    }
                }

                $stageSummary = [
                    'id' => $stage->getKey(),
                    'module_id' => $module->getKey(),
                    'order' => (int) $stage->order,
                    'type' => $stage->module_able,
                    'title' => $stageTitle,
                    'description' => $stageDescription,
                    'duration_minutes' => $durationMinutes,
                    'duration_label' => $this->formatDuration($durationMinutes),
                    'status' => $status,
                    'locked' => $isLocked,
                    'current' => false,
                    'progress' => [
                        'id' => $progress?->getKey(),
                        'status' => $status,
                        'started_at' => $progress?->started_at?->toIso8601String(),
                        'completed_at' => $progress?->completed_at?->toIso8601String(),
                        'deadline_at' => $timeline['deadline_at'],
                        'quiz_result_id' => $progress?->quiz_result_id,
                        'score' => $progress?->quiz_result?->score,
                        'attempt' => $attemptNumber,
                        'earned_points' => $progress?->quiz_result?->earned_points,
                        'total_points' => $stageTotalPoints,
                    ],
                    'quiz' => $this->resolveQuizMeta($stage, $stageTotalPoints),
                    'content' => $this->resolveContentMeta($stage),
                ];

                if (!$isLocked && !$isCompleted && $currentStageId === null) {
                    $stageSummary['current'] = true;
                    $currentStageId = $stage->getKey();
                }

                $moduleStagesData[] = $stageSummary;
                $stageSummaries[$stage->getKey()] = $stageSummary;

                $previousStageCompleted = $previousStageCompleted && $isCompleted;
                $moduleCompleted = $moduleCompleted && ($isCompleted || $stage->module_able === null);
            }

            $moduleIsCompleted = $moduleStageCount === 0 ? true : $moduleCompleted;

            $modules[] = [
                'id' => $module->getKey(),
                'title' => $module->title,
                'description' => $module->description,
                'order' => (int) $module->order,
                'locked' => $moduleLocked,
                'completed' => $moduleLocked ? false : $moduleIsCompleted,
                'stages' => $moduleStagesData,
                'completed_stage_count' => $moduleCompletedCount,
                'total_stage_count' => $moduleStageCount,
            ];

            $previousModulesCompleted = $previousModulesCompleted && $moduleIsCompleted;
        }

        $progressPercentage = $this->calculateProgressPercentage($completedStages, $totalStages);
        $certificateEligible = $requiredQuizPoints <= 0 || $earnedQuizPoints >= $requiredQuizPoints;

        $overview = [
            'course' => $course,
            'modules' => $modules,
            'stage_summaries' => $stageSummaries,
            'stats' => [
                'completed_stages' => $completedStages,
                'total_stages' => $totalStages,
                'progress_percentage' => $progressPercentage,
                'quiz_points' => [
                    'earned' => $earnedQuizPoints,
                    'total' => $totalQuizPoints,
                    'required' => $requiredQuizPoints,
                ],
                'certificate' => [
                    'enabled' => (bool) $course->certification_enabled,
                    'required_points' => $requiredQuizPoints,
                    'eligible' => $certificateEligible,
                ],
            ],
            'current_stage_id' => $currentStageId,
        ];

        return $this->overviewCache[$cacheKey] = $overview;
    }

    public function syncEnrollmentProgress(Enrollment $enrollment, array $overview): void {
        $stats = Arr::get($overview, 'stats', []);
        $percentage = (int) ($stats['progress_percentage'] ?? 0);

        $attributes = ['progress' => $percentage];

        if ($percentage >= 100) {
            if ($enrollment->completed_at === null) {
                $attributes['completed_at'] = now();
            }
        } else {
            if ($enrollment->completed_at !== null) {
                $attributes['completed_at'] = null;
            }
        }

        $enrollment->fill($attributes);

        if ($enrollment->isDirty()) {
            $enrollment->save();
        }
    }

    private function resolveStageTitle(ModuleStage $stage): string {
        return match ($stage->module_able) {
            'content' => $stage->module_content?->title ?? 'Materi',
            'quiz' => $stage->module_quiz?->name ?? 'Kuis',
            default => 'Tahap',
        };
    }

    private function resolveStageDescription(ModuleStage $stage): ?string {
        return match ($stage->module_able) {
            'content' => $stage->module_content?->description,
            'quiz' => $stage->module_quiz?->description,
            default => null,
        };
    }

    private function resolveStageDuration(ModuleStage $stage): ?int {
        return match ($stage->module_able) {
            'content' => $stage->module_content?->duration,
            'quiz' => $stage->module_quiz?->duration,
            default => null,
        };
    }

    private function calculateStageTotalPoints(ModuleStage $stage): int {
        if ($stage->module_able !== 'quiz') {
            return 0;
        }

        $quiz = $stage->module_quiz;

        if (!$quiz instanceof Quiz) {
            return 0;
        }

        $quiz->loadMissing('quiz_questions');

        return $quiz->quiz_questions
            ->sum(static fn (QuizQuestion $question): int => max(0, (int) ($question->points ?? 0)));
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveQuizMeta(ModuleStage $stage, ?int $totalPoints = null): ?array {
        $quiz = $stage->module_quiz;

        if (!$quiz instanceof Quiz) {
            return null;
        }

        if (!isset($quiz->quiz_questions_count)) {
            $quiz->loadCount('quiz_questions');
        }

        $totalPoints ??= $this->calculateStageTotalPoints($stage);

        return [
            'id' => $quiz->getKey(),
            'name' => $quiz->name,
            'question_count' => (int) ($quiz->quiz_questions_count ?? 0),
            'duration_minutes' => $quiz->duration,
            'duration_label' => $this->formatDuration($quiz->duration),
            'is_question_shuffled' => (bool) $quiz->is_question_shuffled,
            'total_points' => $totalPoints,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveContentMeta(ModuleStage $stage): ?array {
        $content = $stage->module_content;

        if ($content === null) {
            return null;
        }

        $fileUrl = $this->resolveContentFileUrl($content->file_path);
        $streamUrl = $this->resolveContentStreamUrl($content);
        $subtitleUrl = $this->resolveContentFileUrl($content->subtitle_path);

        return [
            'id' => $content->getKey(),
            'title' => $content->title,
            'content_type' => $content->content_type,
            'content_url' => $content->content_url,
            'file_url' => $fileUrl,
            'file_stream_url' => $streamUrl,
            'subtitle_url' => $subtitleUrl,
            'duration_minutes' => $content->duration,
            'duration_label' => $this->formatDuration($content->duration),
        ];
    }

    private function resolveContentFileUrl(?string $path): ?string {
        if ($path === null || trim($path) === '') {
            return null;
        }

        if (!Storage::disk('public')->exists($path)) {
            return null;
        }

        return asset('storage/' . ltrim($path, '/'));
    }

    private function resolveContentStreamUrl(ModuleContent $content): ?string {
        $path = $content->file_path;

        if ($path === null || trim($path) === '') {
            return null;
        }

        if (!Storage::disk('public')->exists($path)) {
            return null;
        }

        return route('module-contents.stream', $content);
    }

    private function resolveAttemptNumber(ModuleStage $stage, ?ModuleStageProgress $progress, array $attemptMap): ?int {
        if ($stage->module_able !== 'quiz') {
            return null;
        }

        $quiz = $stage->module_quiz;

        if (!$quiz instanceof Quiz) {
            return null;
        }

        $maxAttempt = (int) ($attemptMap[$quiz->getKey()] ?? 0);

        if ($progress && $progress->quiz_result) {
            $attempt = (int) ($progress->quiz_result->attempt ?? 0);

            if ($attempt > 0) {
                return $attempt;
            }

            return max(1, $maxAttempt);
        }

        return $maxAttempt + 1;
    }

    /**
     * @return array<string, string|null>
     */
    private function resolveTimeline(ModuleStage $stage, ?ModuleStageProgress $progress): array {
        $deadline = null;

        if ($progress && $progress->started_at && $stage->module_able === 'quiz') {
            $duration = $stage->module_quiz?->duration;

            if ($duration !== null && $duration > 0) {
                $deadline = $progress->started_at->copy()->addMinutes($duration);
            }
        }

        return [
            'deadline_at' => $deadline?->toIso8601String(),
        ];
    }

    private function formatDuration(?int $minutes): ?string {
        if ($minutes === null || $minutes <= 0) {
            return null;
        }

        $hours = intdiv($minutes, 60);
        $remainingMinutes = $minutes % 60;

        if ($hours > 0 && $remainingMinutes > 0) {
            return sprintf('%d jam %d menit', $hours, $remainingMinutes);
        }

        if ($hours > 0) {
            return sprintf('%d jam', $hours);
        }

        return sprintf('%d menit', $remainingMinutes);
    }

    private function calculateProgressPercentage(int $completed, int $total): int {
        if ($total === 0) {
            return 100;
        }

        return (int) round(($completed / $total) * 100);
    }
}
