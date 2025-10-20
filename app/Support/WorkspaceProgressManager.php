<?php

namespace App\Support;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\ModuleStage;
use App\Models\ModuleStageProgress;
use App\Models\Quiz;
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

        /** @var \Illuminate\Support\Collection<int, ModuleStageProgress> $progressRecords */
        $progressRecords = $enrollment
            ->module_stage_progresses()
            ->with('quiz_result')
            ->get()
            ->keyBy(static fn (ModuleStageProgress $progress): int => $progress->module_stage_id);

        $modules = [];
        $stageSummaries = [];

        $completedStages = 0;
        $totalStages = 0;
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
                        'attempt' => $progress?->quiz_result?->attempt,
                    ],
                    'quiz' => $this->resolveQuizMeta($stage),
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

        $overview = [
            'course' => $course,
            'modules' => $modules,
            'stage_summaries' => $stageSummaries,
            'stats' => [
                'completed_stages' => $completedStages,
                'total_stages' => $totalStages,
                'progress_percentage' => $this->calculateProgressPercentage($completedStages, $totalStages),
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

    /**
     * @return array<string, mixed>|null
     */
    private function resolveQuizMeta(ModuleStage $stage): ?array {
        $quiz = $stage->module_quiz;

        if (!$quiz instanceof Quiz) {
            return null;
        }

        if (!isset($quiz->quiz_questions_count)) {
            $quiz->loadCount('quiz_questions');
        }

        return [
            'id' => $quiz->getKey(),
            'name' => $quiz->name,
            'question_count' => (int) ($quiz->quiz_questions_count ?? 0),
            'duration_minutes' => $quiz->duration,
            'duration_label' => $this->formatDuration($quiz->duration),
            'is_question_shuffled' => (bool) $quiz->is_question_shuffled,
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

        return [
            'id' => $content->getKey(),
            'title' => $content->title,
            'content_type' => $content->content_type,
            'content_url' => $content->content_url,
            'file_url' => $fileUrl,
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
