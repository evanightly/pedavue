<?php

use App\Data\Course\CourseData;
use App\Models\Course;
use App\Models\CourseCertificateImage;
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

it('stores certificate overlays when creating a certified course', function (): void {
    Storage::fake('public');

    $creator = User::factory()->create();
    $instructor = User::factory()->create();

    $creator->assignRole(RoleEnum::Instructor->value);
    Role::findByName(RoleEnum::Instructor->value)->givePermissionTo(PermissionEnum::CreateCourse->value);

    $template = UploadedFile::fake()->image('template.png', 1600, 900);
    $overlayFile = UploadedFile::fake()->image('overlay.png', 400, 400);
    $clientId = 'overlay-1';

    $response = $this
        ->actingAs($creator)
        ->post(route('courses.store'), [
            'title' => 'Kursus Overlay',
            'description' => '<p>Belajar dengan overlay</p>',
            'instructor_ids' => [$instructor->id],
            'duration' => '90',
            'level' => 'Menengah',
            'certification_enabled' => true,
            'certificate_template' => $template,
            'certificate_name_position_x' => 55,
            'certificate_name_position_y' => 45,
            'certificate_name_box_width' => 42,
            'certificate_name_box_height' => 18,
            'certificate_image_entries' => json_encode([
                [
                    'action' => 'create',
                    'client_id' => $clientId,
                    'label' => 'Logo',
                    'position_x' => 20,
                    'position_y' => 80,
                    'width' => 24,
                    'height' => 24,
                    'z_index' => 1,
                    'file_key' => $clientId,
                ],
            ], JSON_THROW_ON_ERROR),
            'certificate_image_files' => [
                $clientId => $overlayFile,
            ],
        ]);

    $response->assertRedirect();

    /** @var Course|null $course */
    $course = Course::query()->with('certificate_images')->first();

    expect($course)->not->toBeNull();
    expect($course->certificate_images)->toHaveCount(1);

    /** @var CourseCertificateImage $stored */
    $stored = $course->certificate_images->first();

    expect($stored)
        ->label->toBe('Logo')
        ->and($stored->position_x)->toBe(20)
        ->and($stored->position_y)->toBe(80)
        ->and($stored->width)->toBe(24)
        ->and($stored->height)->toBe(24)
        ->and($stored->z_index)->toBe(1)
        ->and(Storage::disk('public')->exists($stored->file_path))->toBeTrue();
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

it('removes certificate overlays when certification is disabled', function (): void {
    Storage::fake('public');

    $creator = User::factory()->create();
    $instructor = User::factory()->create();

    $creator->assignRole(RoleEnum::Instructor->value);
    Role::findByName(RoleEnum::Instructor->value)->givePermissionTo(PermissionEnum::UpdateCourse->value);

    $course = Course::factory()->create([
        'certification_enabled' => true,
    ]);

    $course->course_instructors()->attach([$creator->getKey(), $instructor->getKey()]);

    $overlay = CourseCertificateImage::factory()->create([
        'course_id' => $course->getKey(),
        'file_path' => 'courses/certificates/overlays/existing.png',
        'z_index' => 1,
    ]);

    Storage::disk('public')->put($overlay->file_path, 'overlay');

    $response = $this
        ->actingAs($creator)
        ->put(route('courses.update', $course), [
            'title' => 'Tanpa Sertifikat',
            'description' => '<p>Belajar</p>',
            'duration' => '45',
            'level' => 'Pemula',
            'instructor_ids' => [$instructor->id],
            'certification_enabled' => false,
            'certificate_image_entries' => json_encode([
                [
                    'action' => 'delete',
                    'id' => $overlay->getKey(),
                    'client_id' => 'overlay-1',
                ],
            ], JSON_THROW_ON_ERROR),
        ]);

    $response->assertRedirect();

    $course->refresh();

    expect($course->certificate_images()->count())->toBe(0)
        ->and(Storage::disk('public')->exists($overlay->file_path))->toBeFalse();
});

it('syncs certificate overlays during course update', function (): void {
    Storage::fake('public');

    $creator = User::factory()->create();
    $instructor = User::factory()->create();

    $creator->assignRole(RoleEnum::Instructor->value);
    Role::findByName(RoleEnum::Instructor->value)->givePermissionTo(PermissionEnum::UpdateCourse->value);

    $course = Course::factory()->create([
        'certification_enabled' => true,
        'certificate_name_position_x' => 40,
        'certificate_name_position_y' => 52,
        'certificate_name_box_width' => 46,
        'certificate_name_box_height' => 18,
    ]);

    $course->course_instructors()->attach([$creator->getKey(), $instructor->getKey()]);

    $keepOverlay = CourseCertificateImage::factory()->create([
        'course_id' => $course->getKey(),
        'file_path' => 'courses/certificates/overlays/keep.png',
        'position_x' => 30,
        'position_y' => 70,
        'width' => 20,
        'height' => 20,
        'z_index' => 1,
        'label' => 'Logo',
    ]);

    $deleteOverlay = CourseCertificateImage::factory()->create([
        'course_id' => $course->getKey(),
        'file_path' => 'courses/certificates/overlays/delete.png',
        'position_x' => 60,
        'position_y' => 40,
        'width' => 18,
        'height' => 18,
        'z_index' => 2,
        'label' => 'Badge',
    ]);

    Storage::disk('public')->put($keepOverlay->file_path, 'keep');
    Storage::disk('public')->put($deleteOverlay->file_path, 'delete');

    $updateFileKey = 'update-overlay';
    $newFileKey = 'new-overlay';

    $response = $this
        ->actingAs($creator)
        ->put(route('courses.update', $course), [
            'title' => 'Kursus Overlay Diperbarui',
            'description' => '<p>Belajar dengan overlay</p>',
            'duration' => '120',
            'level' => 'Lanjutan',
            'instructor_ids' => [$instructor->id],
            'certification_enabled' => true,
            'certificate_image_entries' => json_encode([
                [
                    'action' => 'update',
                    'id' => $keepOverlay->getKey(),
                    'client_id' => $updateFileKey,
                    'label' => 'Logo Baru',
                    'position_x' => 25,
                    'position_y' => 75,
                    'width' => 26,
                    'height' => 22,
                    'z_index' => 1,
                    'file_key' => $updateFileKey,
                ],
                [
                    'action' => 'create',
                    'client_id' => $newFileKey,
                    'label' => 'Badge Baru',
                    'position_x' => 60,
                    'position_y' => 50,
                    'width' => 18,
                    'height' => 18,
                    'z_index' => 2,
                    'file_key' => $newFileKey,
                ],
                [
                    'action' => 'delete',
                    'id' => $deleteOverlay->getKey(),
                    'client_id' => 'obsolete-overlay',
                ],
            ], JSON_THROW_ON_ERROR),
            'certificate_image_files' => [
                $updateFileKey => UploadedFile::fake()->image('logo-new.png', 500, 500),
                $newFileKey => UploadedFile::fake()->image('badge-new.png', 400, 400),
            ],
        ]);

    $response->assertRedirect();

    $course->refresh();
    $course->load('certificate_images');

    expect($course->certificate_images)->toHaveCount(2);

    $updatedOverlay = $course->certificate_images->firstWhere('label', 'Logo Baru');
    $createdOverlay = $course->certificate_images->firstWhere('label', 'Badge Baru');

    expect($updatedOverlay)
        ->not->toBeNull()
        ->and($updatedOverlay->position_x)->toBe(25)
        ->and($updatedOverlay->position_y)->toBe(75)
        ->and($updatedOverlay->width)->toBe(26)
        ->and($updatedOverlay->height)->toBe(22)
        ->and($updatedOverlay->z_index)->toBe(1)
        ->and(Storage::disk('public')->exists($updatedOverlay->file_path))->toBeTrue();

    expect(Storage::disk('public')->exists($keepOverlay->file_path))->toBeFalse();

    expect($createdOverlay)
        ->not->toBeNull()
        ->and($createdOverlay->position_x)->toBe(60)
        ->and($createdOverlay->position_y)->toBe(50)
        ->and($createdOverlay->width)->toBe(18)
        ->and($createdOverlay->height)->toBe(18)
        ->and($createdOverlay->z_index)->toBe(2)
        ->and(Storage::disk('public')->exists($createdOverlay->file_path))->toBeTrue();

    expect(Storage::disk('public')->exists($deleteOverlay->file_path))->toBeFalse();
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

    $overlay = CourseCertificateImage::factory()->create([
        'course_id' => $course->getKey(),
        'file_path' => 'courses/certificates/overlays/mapped.png',
        'position_x' => 35,
        'position_y' => 65,
        'width' => 22,
        'height' => 24,
        'z_index' => 3,
        'label' => 'Mapped Overlay',
    ]);

    Storage::disk('public')->put($overlay->file_path, 'overlay');

    $data = CourseData::fromModel($course->fresh('certificate_images'));

    expect($data->certificate_name_position_x)->toBe(55)
        ->and($data->certificate_name_position_y)->toBe(44)
        ->and($data->certificate_name_max_length)->toBe(36)
        ->and($data->certificate_template_url)->toBe(asset('storage/' . $course->certificate_template))
        ->and($data->certificate_example)->toBeNull();

    expect($data->certificate_images)->not->toBeNull();

    $items = $data->certificate_images?->items();

    expect($items)->not->toBeNull();

    $first = $items ? $items[0] : null;

    expect($first)
        ->not->toBeNull()
        ->and($first->label)->toBe('Mapped Overlay')
        ->and($first->position_x)->toBe(35)
        ->and($first->position_y)->toBe(65)
        ->and($first->width)->toBe(22)
        ->and($first->height)->toBe(24)
        ->and($first->z_index)->toBe(3)
        ->and($first->file_url)->toBe(asset('storage/' . $overlay->file_path));
});
