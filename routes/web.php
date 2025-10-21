<?php

use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseInstructorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuizResponseAnswerController;
use App\Http\Controllers\QuizResponseController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('dashboard', DashboardController::class);
    Route::resource('users', UserController::class);
    Route::resource('permissions', PermissionController::class);
    Route::resource('quizzes', QuizController::class);
    Route::post('quizzes/init-questions', [QuizController::class, 'initQuestions'])->name('quizzes.init.questions');
    Route::group(['prefix' => 'quizzes/{quiz}', 'as' => 'quizzes.'], function () {
        Route::get('questions', [QuizController::class, 'questions'])->name('questions');
        Route::post('questions', [QuizController::class, 'addQuestion'])->name('questions.add');
        Route::post('import-questions', [QuizController::class, 'importQuestions'])->name('import.questions');
    });
    Route::resource('quiz-questions', QuizResponseController::class);
    Route::resource('quiz-responses', QuizResponseController::class);
    Route::resource('quiz-response-answers', QuizResponseAnswerController::class);
    Route::resource('roles', RoleController::class);
    Route::resource('courses', CourseController::class);
    Route::post('courses/{course}/instructors', [CourseController::class, 'attachInstructor'])->name('courses.instructors.attach');
    Route::delete('courses/{course}/instructors/{instructor}', [CourseController::class, 'detachInstructor'])->name('courses.instructors.detach');
    Route::resource('course-instructors', CourseInstructorController::class);
});
Route::get('csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
