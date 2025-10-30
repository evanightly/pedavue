<?php

namespace App\Http\Controllers;

use App\Http\Requests\Workspace\CompleteStageRequest;
use App\Http\Requests\Workspace\ReattemptStageQuizRequest;
use App\Http\Requests\Workspace\SaveStageQuizProgressRequest;
use App\Http\Requests\Workspace\SubmitStageQuizRequest;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\ModuleContent;
use App\Models\ModuleStage;
use App\Models\ModuleStageProgress;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionOption;
use App\Models\QuizResult;
use App\Support\Enums\ModuleStageProgressStatus;
use App\Support\WorkspaceProgressManager;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class WorkspaceModuleStageController extends Controller {
    use AuthorizesRequests;

    public function __construct(private WorkspaceProgressManager $progressManager) {}

    public function show(Request $request, Course $course, Module $module, ModuleStage $moduleStage): JsonResponse {
        $this->authorize('accessWorkspace', $course);
        $this->ensureHierarchy($course, $module, $moduleStage);

        $enrollment = $this->progressManager->getEnrollmentFor($request->user(), $course);

        $overview = $this->progressManager->buildOverview($enrollment);
        $stageSummary = $overview['stage_summaries'][$moduleStage->getKey()] ?? null;
        $modulesPayload = null;
        $statsPayload = null;
        $currentStageId = $overview['current_stage_id'];
        $enrollmentPayload = $this->formatEnrollmentData($enrollment, $overview);

        if ($stageSummary === null) {
            abort(404);
        }

        if ($stageSummary['locked'] === true) {
            abort(403, 'Tahap ini masih terkunci.');
        }

        $moduleStage->loadMissing([
            'moduleAble' => static function (MorphTo $morphTo): void {
                $morphTo->morphWith([
                    ModuleContent::class => [],
                    Quiz::class => ['quiz_questions.quiz_question_options'],
                ]);
            },
        ]);

        if ($moduleStage->isQuiz()) {
            $progress = $this->initializeQuizProgress($enrollment, $moduleStage);

            if ($this->quizHasExpired($moduleStage, $progress)) {
                [$progress, $result] = $this->finalizeQuizAttempt(
                    $enrollment,
                    $moduleStage,
                    $progress,
                    $this->extractAnswersFromState($progress),
                    true,
                );

                $this->progressManager->forgetOverview($enrollment);
                $overview = $this->progressManager->buildOverview($enrollment);
                $stageSummary = $overview['stage_summaries'][$moduleStage->getKey()] ?? $stageSummary;
                $this->progressManager->syncEnrollmentProgress($enrollment, $overview);
                $enrollment->refresh();
                $modulesPayload = $overview['modules'];
                $statsPayload = $overview['stats'];
                $currentStageId = $overview['current_stage_id'];
                $enrollmentPayload = $this->formatEnrollmentData($enrollment, $overview);
            }

            $payload = $this->buildQuizPayload($enrollment, $moduleStage, $progress);

            return response()->json([
                'stage' => $stageSummary,
                'quiz' => $payload['quiz'],
                'progress' => $payload['progress'],
                'modules' => $modulesPayload,
                'stats' => $statsPayload,
                'currentStageId' => $currentStageId,
                'enrollment' => $enrollmentPayload,
            ]);
        }

        $progress = $enrollment
            ->module_stage_progresses()
            ->where('module_stage_id', $moduleStage->getKey())
            ->first();

        return response()->json([
            'stage' => $stageSummary,
            'progress' => $progress ? [
                'status' => $progress->status,
                'started_at' => $progress->started_at?->toIso8601String(),
                'completed_at' => $progress->completed_at?->toIso8601String(),
            ] : null,
            'modules' => $modulesPayload,
            'stats' => $statsPayload,
            'currentStageId' => $currentStageId,
            'enrollment' => $enrollmentPayload,
        ]);
    }

    public function complete(CompleteStageRequest $request, Course $course, Module $module, ModuleStage $moduleStage): JsonResponse {
        $this->authorize('accessWorkspace', $course);
        $this->ensureHierarchy($course, $module, $moduleStage);

        $enrollment = $request->enrollment();

        DB::transaction(function () use ($enrollment, $moduleStage): void {
            $progress = ModuleStageProgress::query()
                ->where('enrollment_id', $enrollment->getKey())
                ->where('module_stage_id', $moduleStage->getKey())
                ->lockForUpdate()
                ->first();

            if (!$progress) {
                ModuleStageProgress::query()->create([
                    'enrollment_id' => $enrollment->getKey(),
                    'module_stage_id' => $moduleStage->getKey(),
                    'status' => ModuleStageProgressStatus::Completed->value,
                    'started_at' => now(),
                    'completed_at' => now(),
                ]);

                return;
            }

            $this->completeProgress($progress);
        });

        $this->progressManager->forgetOverview($enrollment);
        $overview = $this->progressManager->buildOverview($enrollment);
        $this->progressManager->syncEnrollmentProgress($enrollment, $overview);
        $enrollment->refresh();

        return response()->json([
            'modules' => $overview['modules'],
            'stats' => $overview['stats'],
            'currentStageId' => $overview['current_stage_id'],
            'stage' => $overview['stage_summaries'][$moduleStage->getKey()] ?? null,
            'enrollment' => $this->formatEnrollmentData($enrollment, $overview),
        ]);
    }

    public function saveQuizProgress(SaveStageQuizProgressRequest $request, Course $course, Module $module, ModuleStage $moduleStage): JsonResponse {
        $this->authorize('accessWorkspace', $course);
        $this->ensureHierarchy($course, $module, $moduleStage);

        $enrollment = $request->enrollment();
        $moduleStage->loadMissing([
            'moduleAble' => static function (MorphTo $morphTo): void {
                $morphTo->morphWith([
                    ModuleContent::class => [],
                    Quiz::class => ['quiz_questions.quiz_question_options'],
                ]);
            },
        ]);

        $progress = $this->initializeQuizProgress($enrollment, $moduleStage);

        $answers = $this->sanitizeAnswers($request->sanitizedAnswers(), $moduleStage);

        DB::transaction(function () use ($enrollment, $moduleStage, $answers): void {
            $progressRecord = ModuleStageProgress::query()
                ->where('enrollment_id', $enrollment->getKey())
                ->where('module_stage_id', $moduleStage->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $state = $progressRecord->state ?? [];
            $state['answers'] = $answers;

            if ($progressRecord->status === ModuleStageProgressStatus::Pending->value) {
                $progressRecord->status = ModuleStageProgressStatus::InProgress->value;
            }

            if ($progressRecord->started_at === null) {
                $progressRecord->started_at = now();
            }

            $progressRecord->state = $state;
            $progressRecord->save();
        });

        return response()->json([
            'message' => 'Jawaban sementara tersimpan.',
        ]);
    }

    public function submitQuiz(SubmitStageQuizRequest $request, Course $course, Module $module, ModuleStage $moduleStage): JsonResponse {
        $this->authorize('accessWorkspace', $course);
        $this->ensureHierarchy($course, $module, $moduleStage);

        $enrollment = $request->enrollment();
        $moduleStage->loadMissing([
            'moduleAble' => static function (MorphTo $morphTo): void {
                $morphTo->morphWith([
                    ModuleContent::class => [],
                    Quiz::class => ['quiz_questions.quiz_question_options'],
                ]);
            },
        ]);

        $progress = $this->initializeQuizProgress($enrollment, $moduleStage);
        $answers = $request->sanitizedAnswers();

        if (empty($answers)) {
            $answers = $this->extractAnswersFromState($progress);
        }

        [$progress, $result] = $this->finalizeQuizAttempt(
            $enrollment,
            $moduleStage,
            $progress,
            $answers,
            $request->isAutoSubmission(),
        );

        $this->progressManager->forgetOverview($enrollment);
        $overview = $this->progressManager->buildOverview($enrollment);
        $this->progressManager->syncEnrollmentProgress($enrollment, $overview);
        $enrollment->refresh();

        $payload = $this->buildQuizPayload($enrollment, $moduleStage, $progress);

        return response()->json([
            'modules' => $overview['modules'],
            'stats' => $overview['stats'],
            'currentStageId' => $overview['current_stage_id'],
            'stage' => $overview['stage_summaries'][$moduleStage->getKey()] ?? null,
            'quiz' => $payload['quiz'],
            'result' => $result,
            'progress' => $payload['progress'],
            'enrollment' => $this->formatEnrollmentData($enrollment, $overview),
        ]);
    }

    public function reattemptQuiz(ReattemptStageQuizRequest $request, Course $course, Module $module, ModuleStage $moduleStage): JsonResponse {
        $this->authorize('accessWorkspace', $course);
        $this->ensureHierarchy($course, $module, $moduleStage);

        if (!$moduleStage->isQuiz()) {
            abort(422, 'Tahap ini tidak memiliki kuis.');
        }

        $enrollment = $request->enrollment();

        $moduleStage->loadMissing([
            'moduleAble' => static function (MorphTo $morphTo): void {
                $morphTo->morphWith([
                    ModuleContent::class => [],
                    Quiz::class => ['quiz_questions.quiz_question_options'],
                ]);
            },
        ]);

        $this->resetQuizProgress($enrollment, $moduleStage);
        $progress = $this->initializeQuizProgress($enrollment, $moduleStage);

        $this->progressManager->forgetOverview($enrollment);
        $overview = $this->progressManager->buildOverview($enrollment);
        $this->progressManager->syncEnrollmentProgress($enrollment, $overview);
        $enrollment->refresh();

        $payload = $this->buildQuizPayload($enrollment, $moduleStage, $progress);

        return response()->json([
            'stage' => $overview['stage_summaries'][$moduleStage->getKey()] ?? null,
            'quiz' => $payload['quiz'],
            'progress' => $payload['progress'],
            'modules' => $overview['modules'],
            'stats' => $overview['stats'],
            'currentStageId' => $overview['current_stage_id'],
            'enrollment' => $this->formatEnrollmentData($enrollment, $overview),
        ]);
    }

    private function ensureHierarchy(Course $course, Module $module, ModuleStage $moduleStage): void {
        abort_unless($module->course_id === $course->getKey(), 404);
        abort_unless($moduleStage->module_id === $module->getKey(), 404);
    }

    private function initializeQuizProgress(Enrollment $enrollment, ModuleStage $stage): ModuleStageProgress {
        return DB::transaction(function () use ($enrollment, $stage): ModuleStageProgress {
            $progress = ModuleStageProgress::query()
                ->where('enrollment_id', $enrollment->getKey())
                ->where('module_stage_id', $stage->getKey())
                ->lockForUpdate()
                ->first();

            if (!$progress) {
                $progress = ModuleStageProgress::query()->create([
                    'enrollment_id' => $enrollment->getKey(),
                    'module_stage_id' => $stage->getKey(),
                    'status' => ModuleStageProgressStatus::InProgress->value,
                    'started_at' => now(),
                    'state' => [],
                ]);
            } elseif ($progress->status === ModuleStageProgressStatus::Pending->value) {
                $progress->status = ModuleStageProgressStatus::InProgress->value;
                if ($progress->started_at === null) {
                    $progress->started_at = now();
                }
                $progress->save();
            }

            $progress = $this->ensureQuizState($progress, $stage);

            $state = $progress->state ?? [];
            $currentAttempt = (int) ($state['current_attempt'] ?? 0);

            if ($currentAttempt <= 0) {
                $state['current_attempt'] = $this->determineAttemptNumber($enrollment, $stage, $progress);
                $progress->state = $state;
                $progress->save();
            }

            return $progress->fresh(['quiz_result']);
        });
    }

    private function ensureQuizState(ModuleStageProgress $progress, ModuleStage $stage): ModuleStageProgress {
        $state = $progress->state ?? [];
        $quiz = $stage->module_quiz;

        if (!$quiz instanceof Quiz) {
            return $progress;
        }

        $quiz->loadMissing('quiz_questions.quiz_question_options');

        $questionOrder = $state['question_order'] ?? null;
        if (!is_array($questionOrder) || count($questionOrder) === 0) {
            $questionOrder = $quiz->quiz_questions->pluck('id')->all();
            if ($quiz->is_question_shuffled) {
                $questionOrder = $this->shuffleIds($questionOrder);
            }
        }

        $optionOrder = $state['option_order'] ?? [];
        $optionOrder = is_array($optionOrder) ? $optionOrder : [];

        foreach ($quiz->quiz_questions as $question) {
            $options = $question->quiz_question_options->pluck('id')->all();
            if ($question->is_answer_shuffled) {
                $options = $this->shuffleIds($options);
            }

            if (!isset($optionOrder[$question->getKey()]) || !is_array($optionOrder[$question->getKey()]) || count($optionOrder[$question->getKey()]) === 0) {
                $optionOrder[$question->getKey()] = $options;
            }
        }

        $state['question_order'] = $questionOrder;
        $state['option_order'] = $optionOrder;

        $progress->state = $state;
        $progress->save();

        return $progress;
    }

    private function completeProgress(ModuleStageProgress $progress): void {
        if ($progress->status !== ModuleStageProgressStatus::Completed->value) {
            if ($progress->started_at === null) {
                $progress->started_at = now();
            }

            $progress->status = ModuleStageProgressStatus::Completed->value;
        }

        $progress->completed_at = now();
        $progress->save();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildQuizPayload(Enrollment $enrollment, ModuleStage $stage, ModuleStageProgress $progress): array {
        $quiz = $stage->module_quiz;

        if (!$quiz instanceof Quiz) {
            abort(422, 'Tahap ini tidak memiliki kuis.');
        }

        $quiz->loadMissing('quiz_questions.quiz_question_options');

        $state = $progress->state ?? [];
        $answers = $this->extractAnswersFromState($progress);
        $questionOrder = Arr::get($state, 'question_order', []);
        $optionOrder = Arr::get($state, 'option_order', []);

        $questions = [];
        $questionMap = $quiz->quiz_questions->keyBy(static fn (QuizQuestion $question) => $question->getKey());

        $totalPoints = 0;

        foreach ($questionOrder as $questionId) {
            /** @var QuizQuestion|null $question */
            $question = $questionMap->get((int) $questionId);
            if (!$question) {
                continue;
            }

            $questionPoints = max(0, (int) ($question->points ?? 0));
            $totalPoints += $questionPoints;

            $options = [];
            $optionIds = $optionOrder[$question->getKey()] ?? $question->quiz_question_options->pluck('id')->all();
            $optionMap = $question->quiz_question_options->keyBy(static fn (QuizQuestionOption $option) => $option->getKey());

            foreach ($optionIds as $optionId) {
                /** @var QuizQuestionOption|null $option */
                $option = $optionMap->get((int) $optionId);
                if (!$option) {
                    continue;
                }

                $options[] = [
                    'id' => $option->getKey(),
                    'text' => $option->option_text,
                    'image_url' => $this->resolveOptionImageUrl($option->option_image),
                ];
            }

            $questions[] = [
                'id' => $question->getKey(),
                'question' => $question->question,
                'question_image_url' => $this->resolveQuestionImageUrl($question->question_image),
                'selection_mode' => $this->determineSelectionMode($question),
                'points' => $questionPoints,
                'options' => $options,
            ];
        }

        $deadline = $this->calculateDeadline($stage, $progress);
        $attemptNumber = $this->determineAttemptNumber($enrollment, $stage, $progress);
        $attemptHistory = Arr::get($progress->state, 'attempt_history', []);

        return [
            'quiz' => [
                'id' => $quiz->getKey(),
                'name' => $quiz->name,
                'description' => $quiz->description,
                'duration_minutes' => $quiz->duration,
                'duration_label' => $this->formatDuration($quiz->duration),
                'questions' => $questions,
                'total_points' => $totalPoints,
            ],
            'progress' => [
                'status' => $progress->status,
                'started_at' => $progress->started_at?->toIso8601String(),
                'completed_at' => $progress->completed_at?->toIso8601String(),
                'deadline_at' => $deadline?->toIso8601String(),
                'server_now' => now()->toIso8601String(),
                'answers' => $answers,
                'score' => $progress->quiz_result?->score,
                'attempt' => $attemptNumber,
                'earned_points' => $progress->quiz_result?->earned_points ?? 0,
                'total_points' => $progress->quiz_result?->total_points ?? $totalPoints,
                'read_only' => $progress->status === ModuleStageProgressStatus::Completed->value,
                'result' => Arr::get($progress->state, 'result'),
                'attempt_history' => is_array($attemptHistory) ? $attemptHistory : [],
            ],
        ];
    }

    /**
     * @return array<int, array<int>>
     */
    private function extractAnswersFromState(ModuleStageProgress $progress): array {
        $state = $progress->state ?? [];
        $answers = Arr::get($state, 'answers', []);

        if (!is_array($answers)) {
            return [];
        }

        $normalized = [];

        foreach ($answers as $questionId => $optionIds) {
            $normalized[(int) $questionId] = collect($optionIds)
                ->map(static fn ($value) => (int) $value)
                ->filter(static fn (int $value) => $value > 0)
                ->unique()
                ->values()
                ->all();
        }

        return $normalized;
    }

    private function quizHasExpired(ModuleStage $stage, ModuleStageProgress $progress): bool {
        $deadline = $this->calculateDeadline($stage, $progress);

        if ($deadline === null) {
            return false;
        }

        return $progress->status !== ModuleStageProgressStatus::Completed->value && now()->greaterThan($deadline);
    }

    private function calculateDeadline(ModuleStage $stage, ModuleStageProgress $progress): ?Carbon {
        if (!$stage->isQuiz()) {
            return null;
        }

        $duration = $stage->module_quiz?->duration;

        if ($duration === null || $duration <= 0) {
            return null;
        }

        if ($progress->started_at === null) {
            return null;
        }

        return $progress->started_at->copy()->addMinutes($duration);
    }

    private function resetQuizProgress(Enrollment $enrollment, ModuleStage $stage): void {
        DB::transaction(function () use ($enrollment, $stage): void {
            $progress = ModuleStageProgress::query()
                ->where('enrollment_id', $enrollment->getKey())
                ->where('module_stage_id', $stage->getKey())
                ->lockForUpdate()
                ->first();

            if (!$progress) {
                return;
            }

            $state = $progress->state ?? [];
            $history = $state['attempt_history'] ?? [];
            $state['attempt_history'] = is_array($history) ? array_values($history) : [];

            unset($state['answers'], $state['result'], $state['question_order'], $state['option_order']);

            $state['current_attempt'] = $this->nextAttemptNumber($enrollment, $stage);

            $progress->state = $state;
            $progress->status = ModuleStageProgressStatus::InProgress->value;
            $progress->quiz_result_id = null;
            $progress->completed_at = null;
            $progress->started_at = now();
            $progress->save();
        });
    }

    private function determineAttemptNumber(Enrollment $enrollment, ModuleStage $stage, ModuleStageProgress $progress): int {
        $state = $progress->state ?? [];
        $currentAttempt = (int) ($state['current_attempt'] ?? 0);

        if ($currentAttempt > 0) {
            return $currentAttempt;
        }

        if (!$stage->isQuiz()) {
            return 1;
        }

        $quiz = $stage->module_quiz;

        if (!$quiz instanceof Quiz) {
            return 1;
        }

        if ($progress->quiz_result) {
            $attempt = (int) ($progress->quiz_result->attempt ?? 0);

            if ($attempt > 0) {
                return $attempt;
            }
        }

        $maxAttempt = (int) QuizResult::query()
            ->where('user_id', $enrollment->user_id)
            ->where('quiz_id', $quiz->getKey())
            ->max('attempt');

        if ($progress->status === ModuleStageProgressStatus::Completed->value) {
            return max(1, $maxAttempt);
        }

        return max(1, $maxAttempt + 1);
    }

    private function nextAttemptNumber(Enrollment $enrollment, ModuleStage $stage): int {
        if (!$stage->isQuiz()) {
            return 1;
        }

        $quiz = $stage->module_quiz;

        if (!$quiz instanceof Quiz) {
            return 1;
        }

        $maxAttempt = (int) QuizResult::query()
            ->where('user_id', $enrollment->user_id)
            ->where('quiz_id', $quiz->getKey())
            ->max('attempt');

        return max(1, $maxAttempt + 1);
    }

    /**
     * @return array{0: ModuleStageProgress, 1: array<string, int>}
     */
    private function finalizeQuizAttempt(Enrollment $enrollment, ModuleStage $stage, ModuleStageProgress $progress, array $answers, bool $autoSubmission): array {
        return DB::transaction(function () use ($enrollment, $stage, $progress, $answers, $autoSubmission): array {
            $lockedProgress = ModuleStageProgress::query()
                ->whereKey($progress->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $stage->loadMissing([
                'moduleAble' => static function (MorphTo $morphTo): void {
                    $morphTo->morphWith([
                        ModuleContent::class => [],
                        Quiz::class => ['quiz_questions.quiz_question_options'],
                    ]);
                },
            ]);
            $sanitizedAnswers = $this->sanitizeAnswers($answers, $stage);
            $result = $this->gradeQuiz($stage, $sanitizedAnswers);

            $state = $lockedProgress->state ?? [];
            $currentAttempt = (int) ($state['current_attempt'] ?? 0);

            if ($currentAttempt <= 0) {
                $currentAttempt = $this->determineAttemptNumber($enrollment, $stage, $lockedProgress);
            }

            $quizResult = $lockedProgress->quiz_result;

            if (!$quizResult instanceof QuizResult) {
                $quizResult = new QuizResult;
                $quizResult->user_id = $enrollment->user_id;
                $quizResult->quiz_id = $stage->module_quiz?->getKey();
            }

            $finishedAt = now();
            $startedAt = $lockedProgress->started_at ?? $finishedAt;

            $quizResult->attempt = $currentAttempt;
            $quizResult->score = $result['score'];
            $quizResult->earned_points = $result['earned_points'];
            $quizResult->total_points = $result['total_points'];
            $quizResult->started_at = $startedAt;
            $quizResult->finished_at = $finishedAt;
            $quizResult->save();

            $lockedProgress->quiz_result_id = $quizResult->getKey();
            $lockedProgress->status = ModuleStageProgressStatus::Completed->value;
            $lockedProgress->completed_at = $finishedAt;

            if ($lockedProgress->started_at === null) {
                $lockedProgress->started_at = $quizResult->started_at;
            }

            $history = $state['attempt_history'] ?? [];
            $history = is_array($history) ? $history : [];

            $history[] = [
                'attempt' => $currentAttempt,
                'score' => $result['score'],
                'correct' => $result['correct_answers'],
                'total' => $result['total_questions'],
                'earned_points' => $result['earned_points'],
                'total_points' => $result['total_points'],
                'auto_submitted' => $autoSubmission,
                'finished_at' => $finishedAt->toIso8601String(),
            ];

            $state['answers'] = $sanitizedAnswers;
            $state['result'] = [
                'score' => $result['score'],
                'correct' => $result['correct_answers'],
                'total' => $result['total_questions'],
                'earned_points' => $result['earned_points'],
                'total_points' => $result['total_points'],
                'auto_submitted' => $autoSubmission,
            ];
            $state['current_attempt'] = $currentAttempt;
            $state['attempt_history'] = array_values($history);

            $lockedProgress->state = $state;
            $lockedProgress->save();

            return [$lockedProgress->fresh(['quiz_result']), $result];
        });
    }

    /**
     * @return array<string, int>
     */
    private function gradeQuiz(ModuleStage $stage, array $answers): array {
        $quiz = $stage->module_quiz;

        if (!$quiz instanceof Quiz) {
            return [
                'score' => 0,
                'total_questions' => 0,
                'correct_answers' => 0,
                'earned_points' => 0,
                'total_points' => 0,
            ];
        }

        $quiz->loadMissing('quiz_questions.quiz_question_options');

        $totalQuestions = $quiz->quiz_questions->count();
        $correct = 0;
        $totalPoints = 0;
        $earnedPoints = 0;

        foreach ($quiz->quiz_questions as $question) {
            $correctOptionIds = $question->quiz_question_options
                ->filter(static fn (QuizQuestionOption $option) => $option->is_correct)
                ->pluck('id')
                ->sort()
                ->values()
                ->all();

            $questionPoints = max(0, (int) ($question->points ?? 0));
            $totalPoints += $questionPoints;

            $selected = collect($answers[$question->getKey()] ?? [])
                ->map(static fn ($value) => (int) $value)
                ->filter(static fn (int $value) => $question->quiz_question_options->contains('id', $value))
                ->sort()
                ->values()
                ->all();

            if ($selected === $correctOptionIds) {
                $correct++;
                $earnedPoints += $questionPoints;
            }
        }

        if ($totalPoints <= 0) {
            $score = $totalQuestions === 0 ? 0 : (int) round(($correct / $totalQuestions) * 100);
        } else {
            $score = (int) round(($earnedPoints / $totalPoints) * 100);
        }

        return [
            'score' => $score,
            'total_questions' => $totalQuestions,
            'correct_answers' => $correct,
            'earned_points' => $earnedPoints,
            'total_points' => $totalPoints,
        ];
    }

    /**
     * @return array<int, array<int>>
     */
    private function sanitizeAnswers(array $answers, ModuleStage $stage): array {
        $quiz = $stage->module_quiz;

        if (!$quiz instanceof Quiz) {
            return [];
        }

        $quiz->loadMissing('quiz_questions.quiz_question_options');
        $questionMap = $quiz->quiz_questions->keyBy(static fn (QuizQuestion $question) => $question->getKey());

        $sanitized = [];

        foreach ($answers as $questionId => $optionIds) {
            /** @var QuizQuestion|null $question */
            $question = $questionMap->get((int) $questionId);
            if (!$question) {
                continue;
            }

            $availableOptions = $question->quiz_question_options->pluck('id')->all();

            $sanitized[(int) $questionId] = collect($optionIds)
                ->map(static fn ($value) => (int) $value)
                ->filter(static fn (int $value) => in_array($value, $availableOptions, true))
                ->unique()
                ->values()
                ->all();
        }

        return $sanitized;
    }

    private function determineSelectionMode(QuizQuestion $question): string {
        $correctCount = $question->quiz_question_options
            ->filter(static fn (QuizQuestionOption $option) => $option->is_correct)
            ->count();

        return $correctCount > 1 ? 'multiple' : 'single';
    }

    private function resolveQuestionImageUrl(?string $path): ?string {
        if ($path === null || trim($path) === '') {
            return null;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        if (!$disk->exists($path)) {
            return null;
        }

        return $disk->url($path);
    }

    private function resolveOptionImageUrl(?string $path): ?string {
        if ($path === null || trim($path) === '') {
            return null;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        if (!$disk->exists($path)) {
            return null;
        }

        return $disk->url($path);
    }

    private function formatDuration(?int $minutes): ?string {
        if ($minutes === null || $minutes <= 0) {
            return null;
        }

        $hours = intdiv($minutes, 60);
        $remaining = $minutes % 60;

        if ($hours > 0 && $remaining > 0) {
            return sprintf('%d jam %d menit', $hours, $remaining);
        }

        if ($hours > 0) {
            return sprintf('%d jam', $hours);
        }

        return sprintf('%d menit', $remaining);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatEnrollmentData(Enrollment $enrollment, ?array $overview = null): array {
        $payload = [
            'id' => $enrollment->getKey(),
            'progress' => $enrollment->progress,
            'progress_label' => sprintf('%d%%', $enrollment->progress),
            'completed_at' => $enrollment->completed_at?->toIso8601String(),
        ];

        if ($overview !== null) {
            $quizPoints = Arr::get($overview, 'stats.quiz_points');
            if (is_array($quizPoints)) {
                $payload['quiz_points'] = [
                    'earned' => (int) ($quizPoints['earned'] ?? 0),
                    'total' => (int) ($quizPoints['total'] ?? 0),
                    'required' => (int) ($quizPoints['required'] ?? 0),
                ];
            }

            $certificate = Arr::get($overview, 'stats.certificate');
            if (is_array($certificate)) {
                $payload['certificate'] = [
                    'enabled' => (bool) ($certificate['enabled'] ?? false),
                    'required_points' => (int) ($certificate['required_points'] ?? 0),
                    'eligible' => (bool) ($certificate['eligible'] ?? false),
                ];
            }
        }

        return $payload;
    }

    /**
     * @param  array<int>  $ids
     * @return array<int>
     */
    private function shuffleIds(array $ids): array {
        shuffle($ids);

        return array_values($ids);
    }
}
