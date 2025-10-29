<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\ModuleStage;
use App\Models\ModuleStageProgress;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionOption;
use App\Models\QuizResult;
use App\Models\User;
use App\Support\Enums\ModuleStageProgressStatus;
use App\Support\Enums\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

it('allows learners to reattempt quizzes and resets progress state', function (): void {
    ensureRoleExists(RoleEnum::Student);

    /** @var User $student */
    $student = User::factory()->create();
    $student->assignRole(RoleEnum::Student->value);

    /** @var Course $course */
    $course = Course::factory()->create([
        'slug' => 'kursus-' . Str::random(8),
    ]);

    /** @var Module $module */
    $module = Module::factory()->create([
        'course_id' => $course->getKey(),
        'order' => 1,
    ]);

    /** @var Quiz $quiz */
    $quiz = Quiz::factory()->create([
        'duration' => 30,
        'is_question_shuffled' => false,
    ]);

    /** @var QuizQuestion $question */
    $question = QuizQuestion::factory()->for($quiz)->create([
        'question' => 'Apa warna langit?',
        'is_answer_shuffled' => false,
        'points' => 10,
    ]);

    /** @var QuizQuestionOption $correctOption */
    $correctOption = QuizQuestionOption::factory()->for($question, 'quiz_question')->create([
        'option_text' => 'Biru',
        'is_correct' => true,
    ]);

    QuizQuestionOption::factory()->for($question, 'quiz_question')->create([
        'option_text' => 'Merah',
        'is_correct' => false,
    ]);

    /** @var ModuleStage $stage */
    $stage = ModuleStage::factory()->create([
        'module_id' => $module->getKey(),
        'order' => 1,
        'module_able_type' => ModuleStage::moduleAbleTypeForKey('quiz'),
        'module_able_id' => $quiz->getKey(),
    ]);

    /** @var Enrollment $enrollment */
    $enrollment = Enrollment::factory()->create([
        'course_id' => $course->getKey(),
        'user_id' => $student->getKey(),
        'progress' => 0,
        'completed_at' => null,
    ]);

    $submitResponse = actingAs($student)
        ->postJson(route('courses.workspace.stages.quiz.submit', [$course, $module, $stage]), [
            'answers' => [
                $question->getKey() => [$correctOption->getKey()],
            ],
        ]);

    $submitResponse->assertOk();
    $submitResponse->assertJsonPath('progress.status', ModuleStageProgressStatus::Completed->value);
    $submitResponse->assertJsonPath('progress.attempt', 1);
    $submitResponse->assertJsonPath('progress.result.score', 100);
    $submitResponse->assertJsonCount(1, 'progress.attempt_history');
    $submitResponse->assertJsonPath('progress.attempt_history.0.attempt', 1);
    $submitResponse->assertJsonPath('progress.attempt_history.0.auto_submitted', false);

    $reattemptResponse = actingAs($student)
        ->postJson(route('courses.workspace.stages.quiz.reattempt', [$course, $module, $stage]));

    $reattemptResponse->assertOk();
    $reattemptResponse->assertJsonPath('progress.status', ModuleStageProgressStatus::InProgress->value);
    $reattemptResponse->assertJsonPath('progress.attempt', 2);
    $reattemptResponse->assertJsonCount(1, 'progress.attempt_history');
    $reattemptResponse->assertJsonPath('progress.attempt_history.0.attempt', 1);
    $reattemptResponse->assertJsonPath('progress.result', null);
    $reattemptResponse->assertJsonPath('progress.read_only', false);

    expect($reattemptResponse->json('progress.answers'))->toBeArray()->toBeEmpty();

    /** @var ModuleStageProgress $progress */
    $progress = ModuleStageProgress::query()
        ->where('enrollment_id', $enrollment->getKey())
        ->where('module_stage_id', $stage->getKey())
        ->firstOrFail();

    expect($progress->status)->toBe(ModuleStageProgressStatus::InProgress->value);
    expect($progress->quiz_result_id)->toBeNull();
    expect($progress->state['current_attempt'])->toBe(2);
    expect($progress->state['attempt_history'])->toHaveCount(1);
    expect($progress->state['attempt_history'][0]['attempt'])->toBe(1);
    expect($progress->state)->not->toHaveKey('result');
    expect($progress->state)->not->toHaveKey('answers');

    expect(QuizResult::query()
        ->where('user_id', $student->getKey())
        ->where('quiz_id', $quiz->getKey())
        ->count())->toBe(1);
});
