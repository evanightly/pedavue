<?php

use App\Data\Course\CourseData;
use App\Models\Course;
use App\Models\User;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

it('stores certificate settings when creating a course', function (): void {
    Storage::fake('public');

    $creator = User::factory()->create();
    $instructor = User::factory()->create();

    $creator->assignRole(RoleEnum::Instructor->value);
    Role::findByName(RoleEnum::Instructor->value)->givePermissionTo(PermissionEnum::CreateCourse->value);

    $response = $this
        ->actingAs($creator)
        ->post(route('courses.store'), [
            'title' => 'Kursus Bersertifikat',
            'description' => '<p>Belajar dengan sertifikat</p>',
            'instructor_ids' => [$instructor->id],
            'duration' => '120',
            'level' => 'Pemula',
            'certification_enabled' => true,
            'certificate_name_position_x' => 45,
            'certificate_name_position_y' => 60,
            'certificate_name_max_length' => 32,
            'certificate_template' => UploadedFile::fake()->image('template.png', 1200, 800),
        ]);

    $response->assertRedirect();

    $course = Course::query()->first();

    expect($course)->not->toBeNull();
    expect($course)
        ->certificate_template->not->toBeNull()
        ->and(Storage::disk('public')->exists($course->certificate_template))->toBeTrue()
        ->and($course->certificate_name_position_x)->toBe(45)
        ->and($course->certificate_name_position_y)->toBe(60)
        ->and($course->certificate_name_max_length)->toBe(32)
        ->and($course->certification_enabled)->toBeTrue();
});

it('resets certificate placement when certification is disabled', function (): void {
    Storage::fake('public');

    $creator = User::factory()->create();
    $instructor = User::factory()->create();

    $creator->assignRole(RoleEnum::Instructor->value);
    Role::findByName(RoleEnum::Instructor->value)->givePermissionTo(PermissionEnum::UpdateCourse->value);

    $course = Course::factory()->create([
        'title' => 'Kursus Bersertifikat',
        'description' => '<p>Belajar</p>',
        'duration' => '90',
        'level' => 'Menengah',
        'certification_enabled' => true,
        'certificate_name_position_x' => 30,
        'certificate_name_position_y' => 40,
        'certificate_name_max_length' => 48,
        'certificate_template' => 'courses/certificates/templates/example.png',
    ]);

    $course->course_instructors()->attach([$creator, $instructor]);

    Storage::disk('public')->put('courses/certificates/templates/example.png', 'template');

    $response = $this
        ->actingAs($creator)
        ->put(route('courses.update', $course), [
            'title' => 'Kursus Tanpa Sertifikat',
            'description' => '<p>Belajar</p>',
            'duration' => '90',
            'level' => 'Menengah',
            'instructor_ids' => [$instructor->id],
            'certification_enabled' => false,
        ]);

    $response->assertRedirect();

    $course->refresh();

    expect($course->certification_enabled)->toBeFalse()
        ->and($course->certificate_name_position_x)->toBeNull()
        ->and($course->certificate_name_position_y)->toBeNull()
        ->and($course->certificate_name_max_length)->toBeNull();
});

it('maps certificate fields in the data resource', function (): void {
    Storage::fake('public');

    $course = Course::factory()->create([
        'certificate_name_position_x' => 55,
        'certificate_name_position_y' => 44,
        'certificate_name_max_length' => 36,
        'certificate_template' => 'courses/certificates/templates/mapped.png',
    ]);

    Storage::disk('public')->put('courses/certificates/templates/mapped.png', 'template');

    $data = CourseData::fromModel($course);

    expect($data->certificate_name_position_x)->toBe(55)
        ->and($data->certificate_name_position_y)->toBe(44)
        ->and($data->certificate_name_max_length)->toBe(36)
        ->and($data->certificate_template_url)->toBe(asset('storage/' . $course->certificate_template))
        ->and($data->certificate_example)->toBeNull();
});
