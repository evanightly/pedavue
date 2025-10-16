<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('dashboard', DashboardController::class);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
