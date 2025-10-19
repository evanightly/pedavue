<?php

use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseInstructorController;
use App\Http\Controllers\CourseModuleContentController;
use App\Http\Controllers\CourseModuleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\EnrollmentRequestController;
use App\Http\Controllers\ModuleContentController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\ModuleStageController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('explore-course', [CourseController::class, 'explore'])->name('courses.explore');
Route::get('courses/{course}', [CourseController::class, 'show'])->name('courses.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('dashboard', DashboardController::class);
    Route::resource('users', UserController::class);
    Route::resource('permissions', PermissionController::class);
    Route::resource('quizzes', QuizController::class);
    Route::resource('roles', RoleController::class);
    Route::resource('courses', CourseController::class)->except(['show']);
    Route::post('courses/{course}/instructors', [CourseController::class, 'attachInstructor'])->name('courses.instructors.attach');
    Route::delete('courses/{course}/instructors/{instructor}', [CourseController::class, 'detachInstructor'])->name('courses.instructors.detach');
    Route::get('courses/{course}/students', [CourseController::class, 'students'])->name('courses.students.index');
    Route::post('courses/{course}/students', [CourseController::class, 'assignStudents'])->name('courses.students.store');
    Route::delete('courses/{course}/students/{student}', [CourseController::class, 'unassignStudent'])->name('courses.students.destroy');
    Route::post('courses/{course}/enrollment-request', [CourseController::class, 'requestEnrollment'])->name('courses.enrollment-request.store');
    Route::resource('course-instructors', CourseInstructorController::class);
    Route::resource('enrollments', EnrollmentController::class);
    Route::resource('enrollment-requests', EnrollmentRequestController::class);
    Route::patch('enrollment-requests/{enrollment_request}/approve', [EnrollmentRequestController::class, 'approve'])->name('enrollment-requests.approve');
    Route::patch('enrollment-requests/{enrollment_request}/reject', [EnrollmentRequestController::class, 'reject'])->name('enrollment-requests.reject');

    Route::scopeBindings()->group(function () {
        Route::prefix('courses/{course}')->group(function () {
            Route::get('modules/create', [CourseModuleController::class, 'create'])->name('courses.modules.create');
            Route::post('modules', [CourseModuleController::class, 'store'])->name('courses.modules.store');
            Route::get('modules/{module}/contents', [CourseModuleContentController::class, 'index'])->name('courses.modules.contents.index');
            Route::post('modules/{module}/contents', [CourseModuleContentController::class, 'store'])->name('courses.modules.contents.store');
            Route::patch('modules/{module}/contents/reorder', [CourseModuleContentController::class, 'reorder'])->name('courses.modules.contents.reorder');
            Route::patch('modules/{module}/contents/{stage}', [CourseModuleContentController::class, 'update'])->name('courses.modules.contents.update');
            Route::delete('modules/{module}/contents/{stage}', [CourseModuleContentController::class, 'destroy'])->name('courses.modules.contents.destroy');
        });
    });
});
Route::post('imporquiz', [QuizController::class, 'import'])->name('quiz.import');
Route::get('csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

Route::resource('modules', ModuleController::class);

Route::resource('module-contents', ModuleContentController::class);

Route::resource('module-stages', ModuleStageController::class);

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
