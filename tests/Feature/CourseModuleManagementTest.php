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
