<?php

use App\Http\Controllers\BookController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\MentorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\HabitController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Public routes will be handled in auth middleware group below

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
    Route::put('/api/conversations/{id}', [AIChatController::class, 'updateConversation'])
        ->name('conversations.update')
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:60,1');
    Route::delete('/api/conversations/{id}', [AIChatController::class, 'deleteConversation'])
        ->name('conversations.delete')
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:60,1');

    Route::post('/api/journals/from-reply', [AIChatController::class, 'saveJournal'])
        ->name('journals.from_reply')
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:60,1');

    Route::post('/api/tasks/from-reply', [AIChatController::class, 'tasksFromReply'])
        ->name('tasks.from_reply')
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:60,1');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Resource routes
    Route::resource('books', BookController::class);
    Route::resource('journals', JournalController::class);
    Route::resource('tasks', TaskController::class);
    Route::resource('habits', HabitController::class);
    
    // Additional endpoints
    Route::post('/tasks/{task}/toggle', [TaskController::class, 'toggle'])->name('tasks.toggle');
    Route::post('/habits/{habit}/checkin', [HabitController::class, 'checkIn'])->name('habits.checkin');
    
    // Notification preferences
    Route::get('/api/notifications/preferences', [NotificationController::class, 'getPreferences'])->name('notifications.preferences');
    Route::post('/api/notifications/preferences', [NotificationController::class, 'updatePreferences'])->name('notifications.update_preferences');
    // Mentor Chat UI
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
    
    // Analytics page
    Route::get('/analytics', fn() => Inertia::render('Analytics/Index'))->name('analytics');
    Route::get('/profile', fn() => Inertia::render('Profile/Index'))->name('profile');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

