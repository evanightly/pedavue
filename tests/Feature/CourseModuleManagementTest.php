<?php

use App\Models\Course;
use App\Models\Module;
use App\Models\ModuleContent;
use App\Models\Quiz;
use App\Models\User;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    foreach (PermissionEnum::cases() as $permission) {
        Permission::findOrCreate($permission->value);
    }

    foreach (RoleEnum::cases() as $role) {
        Role::findOrCreate($role->value);
    }
});

it('requires content type when submitting a URL without an upload', function (): void {
    Storage::fake('public');

    $instructor = createInstructorWithPermission();
    $course = Course::factory()->create();
    $course->course_instructors()->sync([$instructor->getKey()]);

    $module = Module::factory()->create([
        'course_id' => $course->getKey(),
        'order' => 1,
    ]);

    $response = $this
        ->actingAs($instructor)
        ->post(route('courses.modules.contents.store', [$course, $module]), [
            'type' => 'content',
            'content' => [
                'title' => 'Materi via tautan',
                'content_url' => 'https://contoh.test/materi',
                'content_type' => '',
            ],
        ]);

    $response->assertSessionHasErrors(['content.content_type']);
});

it('infers content type automatically for uploaded files', function (): void {
    Storage::fake('public');

    $instructor = createInstructorWithPermission();
    $course = Course::factory()->create();
    $course->course_instructors()->sync([$instructor->getKey()]);

    $module = Module::factory()->create([
        'course_id' => $course->getKey(),
        'order' => 1,
    ]);

    $response = $this
        ->actingAs($instructor)
        ->post(route('courses.modules.contents.store', [$course, $module]), [
            'type' => 'content',
            'content' => [
                'title' => 'Materi Video',
                'description' => 'Unggahan tanpa jenis khusus',
                'duration' => 15,
                'file' => UploadedFile::fake()->create('materi.mp4', 1024, 'video/mp4'),
            ],
        ]);

    $response->assertRedirect(route('courses.modules.contents.index', [$course, $module]));

    $module->refresh();
    $stage = $module->module_stages()->with('module_content')->latest('id')->first();

    expect($stage)->not()->toBeNull()
        ->and($stage?->module_content?->content_type)->toBe('Video');
});
function createInstructorWithPermission(): User {
    $instructor = User::factory()->create();
    $instructor->assignRole(RoleEnum::Instructor->value);
    Role::findByName(RoleEnum::Instructor->value)->givePermissionTo(PermissionEnum::UpdateCourse->value);

    return $instructor;
}

it('allows an instructor to create a module with content stages', function (): void {
    $instructor = createInstructorWithPermission();
    $course = Course::factory()->create();
    $course->course_instructors()->sync([$instructor->getKey()]);

    $response = $this
        ->actingAs($instructor)
        ->post(route('courses.modules.store', $course), [
            'title' => 'Fondasi Pemrograman',
            'description' => 'Modul dasar untuk memulai.',
            'duration' => 180,
            'stages' => [
                [
                    'type' => 'content',
                    'order' => 1,
                    'content' => [
                        'title' => 'Pendahuluan',
                        'description' => 'Memahami tujuan kursus.',
                        'content_type' => 'video',
                        'duration' => 20,
                        'content_url' => 'https://contoh.test/video-pendahuluan',
                    ],
                ],
            ],
        ]);

    $response->assertRedirect(route('courses.show', $course));

    $module = Module::query()->where('course_id', $course->getKey())->first();

    expect($module)->not->toBeNull()
        ->and($module?->title)->toBe('Fondasi Pemrograman');

    $stage = $module?->module_stages()->with('module_content')->first();

    expect($stage)->not->toBeNull()
        ->and($stage?->module_able)->toBe('content')
        ->and($stage?->module_content)->toBeInstanceOf(ModuleContent::class)
        ->and($stage?->module_content?->title)->toBe('Pendahuluan');
});

it('allows an instructor to create a module with an inline quiz stage', function (): void {
    $instructor = createInstructorWithPermission();
    $course = Course::factory()->create();
    $course->course_instructors()->sync([$instructor->getKey()]);

    $response = $this
        ->actingAs($instructor)
        ->post(route('courses.modules.store', $course), [
            'title' => 'Modul Evaluasi',
            'description' => 'Modul dengan kuis inline.',
            'stages' => [
                [
                    'type' => 'quiz',
                    'order' => 1,
                    'quiz' => [
                        'name' => 'Evaluasi Bab 1',
                        'description' => 'Uji pemahaman peserta.',
                        'duration' => 30,
                        'is_question_shuffled' => true,
                        'type' => 'post-test',
                        'questions' => [
                            [
                                'question' => 'Apa itu PHP?',
                                'is_answer_shuffled' => false,
                                'options' => [
                                    ['option_text' => 'Bahasa pemrograman', 'is_correct' => true],
                                    ['option_text' => 'Sistem operasi', 'is_correct' => false],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertRedirect(route('courses.show', $course));

    $module = Module::query()
        ->where('course_id', $course->getKey())
        ->with('module_stages.module_quiz.quiz_questions.quiz_question_options')
        ->first();

    expect($module)->not->toBeNull();

    $stage = $module?->module_stages->first();

    expect($stage)
        ->not->toBeNull()
        ->and($stage?->module_able)
        ->toBe('quiz')
        ->and($stage?->module_quiz)
        ->not->toBeNull();

    $quiz = $stage?->module_quiz;

    expect($quiz?->name)->toBe('Evaluasi Bab 1')
        ->and($quiz?->is_question_shuffled)->toBeTruthy();

    $questions = $quiz?->quiz_questions;

    expect($questions)
        ->not->toBeNull()
        ->and($questions)
        ->toHaveCount(1);

    $options = $questions?->first()?->quiz_question_options;

    expect($options)
        ->not->toBeNull()
        ->and($options)
        ->toHaveCount(2)
        ->and($options?->first()?->is_correct)
        ->toBeTruthy();
});

it('stores and removes quiz option images during module stage management', function (): void {
    Storage::fake('public');

    $instructor = createInstructorWithPermission();
    $course = Course::factory()->create();
    $course->course_instructors()->sync([$instructor->getKey()]);

    $module = Module::factory()->create([
        'course_id' => $course->getKey(),
        'order' => 1,
    ]);

    $questionImage = UploadedFile::fake()->image('question.jpg', 800, 600);
    $optionImage = UploadedFile::fake()->image('option-a.jpg', 600, 400);

    $this
        ->actingAs($instructor)
        ->post(route('courses.modules.contents.store', [$course, $module]), [
            'type' => 'quiz',
            'quiz' => [
                'name' => 'Kuis Gambar',
                'questions' => [
                    [
                        'question' => 'Pilih gambar yang benar',
                        'question_image' => $questionImage,
                        'is_answer_shuffled' => false,
                        'options' => [
                            [
                                'option_text' => 'Jawaban A',
                                'is_correct' => true,
                                'order' => 1,
                                'option_image' => $optionImage,
                            ],
                            [
                                'option_text' => 'Jawaban B',
                                'is_correct' => false,
                                'order' => 2,
                            ],
                        ],
                    ],
                ],
            ],
        ])
        ->assertRedirect(route('courses.modules.contents.index', [$course, $module]));

    $module->refresh();
    $stage = $module->module_stages()
        ->with('module_quiz.quiz_questions.quiz_question_options')
        ->latest('id')
        ->firstOrFail();

    $createdQuestion = $stage->module_quiz?->quiz_questions?->first();

    $createdOption = $stage->module_quiz
        ?->quiz_questions
        ?->first()
        ?->quiz_question_options
        ?->first();

    expect($createdQuestion)
        ->not->toBeNull()
        ->and($createdQuestion?->question_image)
        ->not->toBeNull();

    expect($createdOption)
        ->not->toBeNull()
        ->and($createdOption?->option_image)
        ->not->toBeNull();

    $createdQuestionPath = $createdQuestion?->question_image;
    $createdOptionPath = $createdOption?->option_image;

    expect(Storage::disk('public')->exists($createdQuestionPath))->toBeTrue();
    expect(Storage::disk('public')->exists($createdOptionPath))->toBeTrue();

    $this
        ->actingAs($instructor)
        ->patch(route('courses.modules.contents.update', [$course, $module, $stage]), [
            'type' => 'quiz',
            'order' => $stage->order,
            'quiz' => [
                'name' => 'Kuis Gambar',
                'questions' => [
                    [
                        'question' => 'Pilih jawaban benar',
                        'existing_question_image' => $createdQuestionPath,
                        'remove_question_image' => true,
                        'is_answer_shuffled' => false,
                        'options' => [
                            [
                                'option_text' => 'Jawaban A',
                                'is_correct' => true,
                                'order' => 1,
                                'existing_option_image' => $createdOptionPath,
                                'remove_option_image' => true,
                            ],
                            [
                                'option_text' => 'Jawaban B',
                                'is_correct' => false,
                                'order' => 2,
                            ],
                        ],
                    ],
                ],
            ],
        ])
        ->assertRedirect(route('courses.modules.contents.index', [$course, $module]));

    $module->refresh();
    $updatedStage = $module->module_stages()
        ->with('module_quiz.quiz_questions.quiz_question_options')
        ->find($stage->getKey());

    $updatedQuestion = $updatedStage
        ?->module_quiz
        ?->quiz_questions
        ?->first();

    $updatedOption = $updatedQuestion
        ?->quiz_question_options
        ?->first();

    expect($updatedQuestion)
        ->not->toBeNull()
        ->and($updatedQuestion?->question_image)
        ->toBeNull();

    expect($updatedOption)
        ->not->toBeNull()
        ->and($updatedOption?->option_image)
        ->toBeNull();

    expect(Storage::disk('public')->exists($createdQuestionPath))->toBeFalse();
    expect(Storage::disk('public')->exists($createdOptionPath))->toBeFalse();
});

it('allows an instructor to attach a quiz stage to an existing module', function (): void {
    $instructor = createInstructorWithPermission();
    $course = Course::factory()->create();
    $course->course_instructors()->sync([$instructor->getKey()]);

    $module = Module::factory()->create([
        'course_id' => $course->getKey(),
        'order' => 1,
    ]);

    $quiz = Quiz::factory()->create([
        'name' => 'Evaluasi Bab 1',
    ]);

    $response = $this
        ->actingAs($instructor)
        ->post(route('courses.modules.contents.store', [$course, $module]), [
            'type' => 'quiz',
            'order' => 2,
            'quiz_id' => $quiz->getKey(),
        ]);

    $response->assertRedirect(route('courses.modules.contents.index', [$course, $module]));

    $module->refresh();
    $stage = $module->module_stages()->latest('order')->first();

    expect($stage)->not->toBeNull()
        ->and($stage?->module_able)->toBe('quiz')
        ->and($stage?->module_quiz_id)->toBe($quiz->getKey());
});

it('forbids users without instructor permission from managing modules', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('courses.modules.store', $course), [
            'title' => 'Percobaan Modul',
            'stages' => [
                [
                    'type' => 'content',
                    'order' => 1,
                    'content' => [
                        'title' => 'Dummy',
                        'description' => 'Tes',
                        'content_type' => 'artikel',
                        'duration' => 10,
                        'content_url' => 'https://contoh.test',
                    ],
                ],
            ],
        ]);

    $response->assertForbidden();
});

it('displays the module content management screen', function (): void {
    $instructor = createInstructorWithPermission();
    $course = Course::factory()->create();
    $course->course_instructors()->sync([$instructor->getKey()]);

    $module = Module::factory()->create([
        'course_id' => $course->getKey(),
        'order' => 1,
    ]);

    $this->withoutVite();

    $this
        ->actingAs($instructor)
        ->get(route('courses.modules.contents.index', [$course, $module]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('course/module/contents/index')
            ->where('module.id', $module->getKey())
        );
});
