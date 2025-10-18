<?php

use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseInstructorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('dashboard', DashboardController::class);
    Route::resource('users', UserController::class);
    Route::resource('permissions', PermissionController::class);
    Route::resource('roles', RoleController::class);
    Route::resource('courses', CourseController::class);
    Route::post('courses/{course}/instructors', [CourseController::class, 'attachInstructor'])->name('courses.instructors.attach');
    Route::delete('courses/{course}/instructors/{instructor}', [CourseController::class, 'detachInstructor'])->name('courses.instructors.detach');
    Route::resource('course-instructors', CourseInstructorController::class);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
