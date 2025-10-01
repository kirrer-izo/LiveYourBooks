<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');
Route::get('/books', fn() => Inertia::render('Books/Index'))->name('books');
Route::get('/mentors', fn() => Inertia::render('Mentors'))->name('mentors');
Route::get('/tasks', fn() => Inertia::render('Tasks'))->name('tasks');
Route::get('/habits', fn() => Inertia::render('Habits'))->name('habits');
Route::get('/journals', fn() => Inertia::render('Journals'))->name('journals');
Route::get('/analytics', fn() => Inertia::render('Analytics'))->name('analytics');
Route::get('/profile', fn() => Inertia::render('Profile'))->name('profile');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
