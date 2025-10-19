<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\EnrollmentRequest;
use App\Models\User;
use App\Support\Enums\EnrollmentRequestEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller {
    /**
     * Show the registration page.
     */
    public function create(Request $request): Response {
        $courses = Course::query()
            ->select(['id', 'title'])
            ->orderBy('title')
            ->get()
            ->map(static fn (Course $course) => [
                'id' => $course->getKey(),
                'title' => $course->title,
            ]);

        $requestedCourse = $request->query('course');
        $defaultCourseId = null;

        if (is_numeric($requestedCourse)) {
            $requestedId = (int) $requestedCourse;

            $defaultCourseId = $courses
                ->firstWhere('id', $requestedId)['id'] ?? null;
        }

        $redirectTo = $request->query('redirect_to');
        if (!is_string($redirectTo) || !str_starts_with($redirectTo, '/')) {
            $redirectTo = null;
        }

        return Inertia::render('auth/register', [
            'roleOptions' => [
                ['value' => RoleEnum::Student->value, 'label' => 'Student'],
                ['value' => RoleEnum::Instructor->value, 'label' => 'Instructor'],
            ],
            'courseOptions' => $courses,
            'defaultRole' => RoleEnum::Student->value,
            'defaultCourseId' => $defaultCourseId,
            'redirectTo' => $redirectTo,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse {
        $request->merge([
            'course_id' => $request->filled('course_id') ? $request->input('course_id') : null,
            'redirect_to' => $request->filled('redirect_to') ? trim((string) $request->input('redirect_to')) : null,
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'string', Rule::in([RoleEnum::Student->value, RoleEnum::Instructor->value])],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'enrollment_message' => ['nullable', 'string', 'max:1000'],
            'redirect_to' => ['nullable', 'string', 'starts_with:/', 'max:255'],
        ]);

        $role = isset($validated['role'])
            ? RoleEnum::from($validated['role'])
            : RoleEnum::Student;

        $courseId = isset($validated['course_id']) ? (int) $validated['course_id'] : null;
        $redirectTo = array_key_exists('redirect_to', $validated)
            ? ($validated['redirect_to'] !== null ? (string) $validated['redirect_to'] : null)
            : null;

        $user = null;

        DB::transaction(function () use (&$user, $validated, $role, $courseId): void {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]);

            $user->assignRole($role->value);

            if ($role === RoleEnum::Student && $courseId !== null) {
                $message = array_key_exists('enrollment_message', $validated)
                    ? trim((string) $validated['enrollment_message'])
                    : null;

                $message = $message === '' ? null : $message;

                EnrollmentRequest::query()->create([
                    'user_id' => $user->getKey(),
                    'course_id' => $courseId,
                    'message' => $message,
                    'status' => EnrollmentRequestEnum::Pending,
                ]);
            }
        });

        event(new Registered($user));

        Auth::login($user);

        $request->session()->regenerate();

        if ($role === RoleEnum::Student) {
            if ($courseId !== null) {
                return redirect()->route('enrollment-requests.index');
            }

            if ($redirectTo !== null) {
                return redirect($redirectTo);
            }

            return redirect()->route('courses.explore');
        }

        if ($redirectTo !== null) {
            return redirect($redirectTo);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
