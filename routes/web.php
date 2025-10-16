<?php

use App\Http\Controllers\BookController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\MentorController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');
// Route::get('/books', fn() => Inertia::render('Books/Index'))->name('books');
// Route::get('/books/create', fn() => Inertia::render('Books/Create'))->name('books.create');

Route::get('/tasks', fn() => Inertia::render('Tasks/Index'))->name('tasks');
Route::get('/habits', fn() => Inertia::render('Habits/Index'))->name('habits');
Route::get('/journals', fn() => Inertia::render('Journals/Index'))->name('journals');
Route::get('/analytics', fn() => Inertia::render('Analytics/Index'))->name('analytics');
Route::get('/profile', fn() => Inertia::render('Profile/Index'))->name('profile');

// AI Chat endpoint
Route::post('/api/mentor-chat', [AIChatController::class, 'chat'])
    ->name('mentor.chat')
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
    ->middleware('throttle:60,1');

// Conversations APIs
Route::middleware(['auth'])->group(function () {
    Route::get('/api/conversations', [AIChatController::class, 'conversations'])
        ->name('conversations.list')
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:120,1');
    Route::get('/api/conversations/{id}', [AIChatController::class, 'conversation'])
        ->name('conversations.show')
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:120,1');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    Route::resource('books', BookController::class);
    Route::get('/mentor/chat', function () {
        $books = \App\Models\Book::where('user_id', \Illuminate\Support\Facades\Auth::id())
            ->select('id','title','author')
            ->orderBy('title')
            ->get();
        $mentorNames = \App\Models\Book::where('user_id', \Illuminate\Support\Facades\Auth::id())
            ->whereNotNull('author')
            ->where('author', '!=', '')
            ->select('author')
            ->distinct()
            ->orderBy('author')
            ->pluck('author');
        return Inertia::render('Mentor/Chat', [
            'books' => $books,
            'mentors' => $mentorNames,
        ]);
    })->name('mentor.chat.ui');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

