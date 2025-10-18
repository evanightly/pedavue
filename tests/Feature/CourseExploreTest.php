<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\EnrollmentRequest;
use App\Models\User;
use App\Support\Enums\EnrollmentRequestEnum;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

it('lists only courses without enrollments or pending requests for the student', function (): void {
    $student = User::factory()->create();
    $student->assignRole(RoleEnum::Student->value);

    $enrolledCourse = Course::factory()->create(['slug' => 'already-enrolled']);
    $availableCourse = Course::factory()->create(['slug' => 'open-course']);
    $pendingCourse = Course::factory()->create(['slug' => 'pending-course']);

    Enrollment::query()->create([
        'course_id' => $enrolledCourse->getKey(),
        'user_id' => $student->getKey(),
        'progress' => 0,
        'completed_at' => null,
    ]);

    EnrollmentRequest::query()->create([
        'course_id' => $pendingCourse->getKey(),
        'user_id' => $student->getKey(),
        'status' => EnrollmentRequestEnum::Pending,
    ]);

    $response = $this
        ->actingAs($student)
        ->get(route('courses.explore'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('course/explore')
            ->where('courses.data', function ($data) use ($availableCourse): bool {
                if ($data instanceof \Illuminate\Support\Collection) {
                    $data = $data->values()->all();
                }

                if (!is_array($data) || count($data) !== 1) {
                    return false;
                }

                return ($data[0]['slug'] ?? null) === $availableCourse->slug;
            })
        );
});

it('allows guests to explore available courses', function (): void {
    Course::factory()->count(3)->create();

    $this->get(route('courses.explore'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('course/explore'));
});

it('allows a student to submit a new enrollment request with an optional message', function (): void {
    $student = User::factory()->create();
    $student->assignRole(RoleEnum::Student->value);

    $course = Course::factory()->create([
        'slug' => 'data-visualization',
    ]);

    $response = $this
        ->actingAs($student)
        ->post(route('courses.enrollment-request.store', $course), [
            'message' => '  Saya ingin memperdalam materi ini.  ',
        ]);

    $response
        ->assertRedirect(route('courses.show', $course))
        ->assertSessionHas('flash.success', 'Permintaan pendaftaran berhasil dikirim.');

    $request = EnrollmentRequest::query()
        ->where('course_id', $course->getKey())
        ->where('user_id', $student->getKey())
        ->first();

    expect($request)->not->toBeNull()
        ->and($request?->message)->toBe('Saya ingin memperdalam materi ini.')
        ->and($request?->status)->toBe(EnrollmentRequestEnum::Pending);
});

it('prevents duplicate enrollment requests when a pending request exists', function (): void {
    $student = User::factory()->create();
    $student->assignRole(RoleEnum::Student->value);

    $course = Course::factory()->create([
        'slug' => 'laravel-security',
    ]);

    EnrollmentRequest::query()->create([
        'course_id' => $course->getKey(),
        'user_id' => $student->getKey(),
        'status' => EnrollmentRequestEnum::Pending,
    ]);

    $response = $this
        ->actingAs($student)
        ->post(route('courses.enrollment-request.store', $course), [
            'message' => 'Mohon diproses lebih cepat.',
        ]);

    $response
        ->assertRedirect(route('courses.show', $course))
        ->assertSessionHas('flash.info', 'Permintaan pendaftaran Anda sedang diproses.');

    $this->assertDatabaseCount('enrollment_requests', 1);
});

it('forbids non-students from creating enrollment requests', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create([
        'slug' => 'advanced-analytics',
    ]);

    $this
        ->actingAs($user)
        ->post(route('courses.enrollment-request.store', $course), [
            'message' => 'Saya ingin bergabung.',
        ])
        ->assertForbidden();

    $this->assertDatabaseCount('enrollment_requests', 0);
});
