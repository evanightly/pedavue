<?php

use App\Models\Course;
use App\Models\Module;
use App\Models\ModuleContent;
use App\Models\ModuleStage;
use App\Models\User;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    ensureRoleExists(RoleEnum::Instructor);
    ensureRoleExists(RoleEnum::Student);
    createPermissionEnumRecord(PermissionEnum::ReadCourse);
});

it('streams module content for authorized instructors with range support', function (): void {
    Storage::fake('public');

    $instructor = User::factory()->createOne();
    $instructor->assignRole(RoleEnum::Instructor->value);

    $course = Course::factory()->create([
        'slug' => 'stream-course',
    ]);

    $course->course_instructors()->sync([$instructor->getKey()]);

    $module = Module::factory()->create([
        'course_id' => $course->getKey(),
    ]);

    $stage = ModuleStage::factory()->create([
        'module_id' => $module->getKey(),
    ]);

    $upload = UploadedFile::fake()->createWithContent('preview.mp4', str_repeat('0', 2048));
    $path = $upload->storeAs('courses/modules/contents', $upload->hashName(), 'public');

    $content = ModuleContent::factory()->create([
        'module_stage_id' => $stage->getKey(),
        'file_path' => $path,
        'content_type' => 'Video',
    ]);

    $this->actingAs($instructor);

    $initialResponse = $this->get(route('module-contents.stream', $content));
    $initialResponse->assertOk();
    $initialResponse->assertHeader('Accept-Ranges', 'bytes');
    expect($initialResponse->headers->get('Content-Type'))->not->toBeNull();
    expect($initialResponse->headers->get('Content-Disposition'))->toStartWith('inline;');

    $partialResponse = $this
        ->withHeaders(['Range' => 'bytes=0-199'])
        ->get(route('module-contents.stream', $content));

    $partialResponse->assertStatus(206);
    $partialResponse->assertHeader('Accept-Ranges', 'bytes');
});

it('rejects streaming requests from unauthorized users', function (): void {
    Storage::fake('public');

    $instructor = User::factory()->createOne();
    $instructor->assignRole(RoleEnum::Instructor->value);

    $course = Course::factory()->create([
        'slug' => 'private-course',
    ]);

    $course->course_instructors()->sync([$instructor->getKey()]);

    $module = Module::factory()->create([
        'course_id' => $course->getKey(),
    ]);

    $stage = ModuleStage::factory()->create([
        'module_id' => $module->getKey(),
    ]);

    $upload = UploadedFile::fake()->createWithContent('lesson.mp4', str_repeat('1', 1024));
    $path = $upload->storeAs('courses/modules/contents', $upload->hashName(), 'public');

    $content = ModuleContent::factory()->create([
        'module_stage_id' => $stage->getKey(),
        'file_path' => $path,
        'content_type' => 'Video',
    ]);

    $this->actingAs(User::factory()->createOne());

    $response = $this->get(route('module-contents.stream', $content));

    $response->assertForbidden();
});
