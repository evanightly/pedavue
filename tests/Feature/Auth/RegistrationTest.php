<?php

use App\Models\Course;
use App\Models\EnrollmentRequest;
use App\Support\Enums\EnrollmentRequestEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Role::findOrCreate(RoleEnum::Student->value);
    Role::findOrCreate(RoleEnum::Instructor->value);
});

it('renders the registration screen with optional defaults', function (): void {
    $course = Course::factory()->create();
    $redirectPath = route('courses.show', $course, absolute: false) . '?enroll=1';

    $this->get(route('register', ['course' => $course->getKey(), 'redirect_to' => $redirectPath]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->where('defaultCourseId', $course->getKey())
            ->where('redirectTo', $redirectPath)
        );
});

it('allows a student to register without selecting a course', function (): void {
    $response = $this->post(route('register.store'), [
        'name' => 'Guest Student',
        'email' => 'student@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => RoleEnum::Student->value,
        'course_id' => null,
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('courses.explore'));
    $this->assertDatabaseCount('enrollment_requests', 0);
});

it('creates an enrollment request when a student selects a course during registration', function (): void {
    $course = Course::factory()->create();

    $response = $this->post(route('register.store'), [
        'name' => 'Course Seeker',
        'email' => 'seeker@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => RoleEnum::Student->value,
        'course_id' => $course->getKey(),
        'enrollment_message' => '  Saya ingin belajar lebih dalam.  ',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('enrollment-requests.index'));

    $request = EnrollmentRequest::query()->first();

    expect($request)->not->toBeNull()
        ->and($request?->course_id)->toBe($course->getKey())
        ->and($request?->status)->toBe(EnrollmentRequestEnum::Pending)
        ->and($request?->message)->toBe('Saya ingin belajar lebih dalam.');
});

it('respects a custom redirect after registration when no course is chosen', function (): void {
    $target = '/courses/data-visualization?enroll=1';

    $response = $this->post(route('register.store'), [
        'name' => 'Redirect User',
        'email' => 'redirect@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => RoleEnum::Student->value,
        'redirect_to' => $target,
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect($target);
});

it('allows instructors to register and reach the dashboard', function (): void {
    $response = $this->post(route('register.store'), [
        'name' => 'Instructor Example',
        'email' => 'instructor@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => RoleEnum::Instructor->value,
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard.index', absolute: false));
});
