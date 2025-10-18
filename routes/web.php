<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('dashboard', DashboardController::class);
    Route::resource('users', UserController::class);
    Route::resource('permissions', PermissionController::class);
    Route::resource('quizzes', QuizController::class);
    Route::resource('roles', RoleController::class);
});
Route::post('imporquiz', [QuizController::class, 'import'])->name('quiz.import');
Route::get('csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
