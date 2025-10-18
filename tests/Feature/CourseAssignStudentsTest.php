<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
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

it('allows an instructor with permission to assign multiple students to their course', function (): void {
    $instructor = User::factory()->create();
    $students = User::factory()->count(2)->create();

    $instructor->assignRole(RoleEnum::Instructor->value);
    Role::findByName(RoleEnum::Instructor->value)->givePermissionTo(PermissionEnum::CreateEnrollment->value);

    foreach ($students as $student) {
        $student->assignRole(RoleEnum::Student->value);
    }

    $course = Course::factory()->create([
        'slug' => 'laravel-unit-testing',
    ]);
    $course->course_instructors()->sync([$instructor->getKey()]);

    $response = $this
        ->actingAs($instructor)
        ->post(route('courses.students.store', $course), [
            'user_ids' => $students->pluck('id')->all(),
        ]);

    $response->assertRedirect(route('courses.students.index', $course));

    $students->each(function (User $student) use ($course): void {
        $enrollment = Enrollment::query()
            ->where('course_id', $course->getKey())
            ->where('user_id', $student->getKey())
            ->first();

        expect($enrollment)->not->toBeNull()
            ->and($enrollment->progress)->toBe(0)
            ->and($enrollment->completed_at)->toBeNull();
    });
});

it('lists only unenrolled students when assigning participants', function (): void {
    $instructor = User::factory()->create();
    $unenrolledStudent = User::factory()->create();
    $enrolledStudent = User::factory()->create();

    $instructor->assignRole(RoleEnum::Instructor->value);
    Role::findByName(RoleEnum::Instructor->value)->givePermissionTo(PermissionEnum::CreateEnrollment->value);

    $unenrolledStudent->assignRole(RoleEnum::Student->value);
    $enrolledStudent->assignRole(RoleEnum::Student->value);

    $course = Course::factory()->create([
        'slug' => 'inertia-data-table',
    ]);
    $course->course_instructors()->sync([$instructor->getKey()]);

    Enrollment::query()->create([
        'course_id' => $course->getKey(),
        'user_id' => $enrolledStudent->getKey(),
        'progress' => 0,
        'completed_at' => null,
    ]);

    $response = $this
        ->actingAs($instructor)
        ->get(route('courses.students.index', $course));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('course/assign-students')
            ->where('students.data', function ($data) use ($unenrolledStudent): bool {
                if ($data instanceof \Illuminate\Support\Collection) {
                    $data = $data->values()->all();
                }

                if (!is_array($data) || count($data) !== 1) {
                    return false;
                }

                return (int) ($data[0]['id'] ?? 0) === $unenrolledStudent->getKey();
            })
        );
});

it('forbids non-instructors even with permission from assigning students', function (): void {
    $user = User::factory()->create();
    $student = User::factory()->create();
    $student->assignRole(RoleEnum::Student->value);

    $user->givePermissionTo(PermissionEnum::CreateEnrollment->value);

    $course = Course::factory()->create([
        'slug' => 'secure-course',
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('courses.students.store', $course), [
            'user_ids' => [$student->getKey()],
        ]);

    $response->assertForbidden();
});

it('allows only enrolled students and instructors to view a course', function (): void {
    $instructor = User::factory()->create();
    $student = User::factory()->create();
    $otherStudent = User::factory()->create();

    $instructor->assignRole(RoleEnum::Instructor->value);
    Role::findByName(RoleEnum::Instructor->value)->givePermissionTo(PermissionEnum::ReadCourse->value);

    $student->assignRole(RoleEnum::Student->value);
    $otherStudent->assignRole(RoleEnum::Student->value);

    $course = Course::factory()->create([
        'slug' => 'restricted-course',
    ]);
    $course->course_instructors()->sync([$instructor->getKey()]);

    $this->actingAs($otherStudent)
        ->get(route('courses.show', $course))
        ->assertForbidden();

    Enrollment::query()->create([
        'course_id' => $course->getKey(),
        'user_id' => $student->getKey(),
        'progress' => 0,
        'completed_at' => null,
    ]);

    $this->actingAs($student)
        ->get(route('courses.show', $course))
        ->assertOk();

    $this->actingAs($instructor)
        ->get(route('courses.show', $course))
        ->assertOk();
});

it('limits the course index to enrolled courses for students without global permission', function (): void {
    $student = User::factory()->create();
    $student->assignRole(RoleEnum::Student->value);

    $enrolledCourse = Course::factory()->create([
        'slug' => 'enrolled-course',
    ]);

    $otherCourse = Course::factory()->create([
        'slug' => 'other-course',
    ]);

    Enrollment::query()->create([
        'course_id' => $enrolledCourse->getKey(),
        'user_id' => $student->getKey(),
        'progress' => 0,
        'completed_at' => null,
    ]);

    $response = $this
        ->actingAs($student)
        ->get(route('courses.index'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('course/index')
            ->where('courses.data', function ($data) use ($enrolledCourse): bool {
                if ($data instanceof \Illuminate\Support\Collection) {
                    $data = $data->values()->all();
                }

                if (!is_array($data) || count($data) !== 1) {
                    return false;
                }

                return ($data[0]['slug'] ?? null) === $enrolledCourse->slug;
            })
        );

    $this
        ->actingAs($student)
        ->get(route('courses.show', $otherCourse))
        ->assertForbidden();
});
