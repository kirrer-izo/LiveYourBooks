<?php

use App\Http\Controllers\BookController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\MentorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\HabitController;
use App\Http\Controllers\ThinkerController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AIFeaturesController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Public dashboard route - redirects to auth dashboard if logged in
Route::get('/dashboard', function () {
    if (auth()->check()) {
        return app(\App\Http\Controllers\DashboardController::class)->index();
    }
    return redirect()->route('login');
})->name('dashboard');

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

    Route::post('/api/books/{book_id}/generate-tasks', [AIChatController::class, 'generateTaskSuggestions'])
        ->name('books.generate_tasks')
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:30,1');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Resource routes
    Route::resource('books', BookController::class);
    Route::resource('journals', JournalController::class);
    Route::resource('tasks', TaskController::class);
    Route::resource('habits', HabitController::class);
    Route::resource('thinkers', ThinkerController::class);
    
    // Book specific routes
    Route::get('/books/{book}/download', [BookController::class, 'download'])->name('books.download');
    
    // Additional endpoints
    Route::post('/tasks/{task}/toggle', [TaskController::class, 'toggle'])->name('tasks.toggle');
    Route::post('/api/tasks/bulk-create', [TaskController::class, 'bulkCreate'])->name('tasks.bulk-create');
    Route::post('/habits/{habit}/checkin', [HabitController::class, 'checkIn'])->name('habits.checkin');
    Route::post('/thinkers/{thinker}/toggle', [ThinkerController::class, 'toggle'])->name('thinkers.toggle');
    Route::get('/thinkers/available', [ThinkerController::class, 'available'])->name('thinkers.available');
    
    // Notification preferences
    Route::get('/api/notifications/preferences', [NotificationController::class, 'getPreferences'])->name('notifications.preferences');
    Route::post('/api/notifications/preferences', [NotificationController::class, 'updatePreferences'])->name('notifications.update_preferences');
    // Mentor Chat UI
    Route::get('/mentor/chat', function () {
        $books = \App\Models\Book::where('user_id', \Illuminate\Support\Facades\Auth::id())
            ->select('id','title','author')
            ->orderBy('title')
            ->get();
        
        // Get authors from books
        $bookAuthors = \App\Models\Book::where('user_id', \Illuminate\Support\Facades\Auth::id())
            ->whereNotNull('author')
            ->where('author', '!=', '')
            ->select('author')
            ->distinct()
            ->orderBy('author')
            ->pluck('author')
            ->toArray();
        
        // Get thinkers from ThinkerType enum
        $thinkerTypes = \App\Enums\ThinkerType::getPredefinedThinkers();
        $thinkerNames = array_map(fn($type) => $type->getDisplayName(), $thinkerTypes);
        
        // Combine and sort all authors/thinkers
        $mentorNames = array_unique(array_merge($bookAuthors, $thinkerNames));
        sort($mentorNames);
        
        return Inertia::render('Mentor/Chat', [
            'books' => $books,
            'mentors' => $mentorNames,
        ]);
    })->name('mentor.chat.ui');
    
    // Analytics page
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics');
    // Profile routes
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'index'])->name('profile');
    Route::post('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/password', [\App\Http\Controllers\ProfileController::class, 'updatePassword'])->name('profile.password.update');
    
    // AI Features
    Route::get('/ai/features', [AIFeaturesController::class, 'index'])->name('ai.features');
    Route::post('/ai/generate-summary', [AIFeaturesController::class, 'generateSummary'])->name('ai.generate-summary');
    Route::post('/ai/generate-advice', [AIFeaturesController::class, 'generateAdvice'])->name('ai.generate-advice');
    Route::post('/ai/save-advice-to-journal', [AIFeaturesController::class, 'saveAdviceToJournal'])->name('ai.save-advice-to-journal');
    Route::post('/ai/generate-tasks-from-advice', [AIFeaturesController::class, 'generateTasksFromAdvice'])->name('ai.generate-tasks-from-advice');
    Route::post('/ai/generate-routine', [AIFeaturesController::class, 'generateRoutine'])->name('ai.generate-routine');
    Route::post('/ai/customize-routine', [AIFeaturesController::class, 'customizeRoutine'])->name('ai.customize-routine');
    Route::get('/ai/time-suggestions', [AIFeaturesController::class, 'getTimeSuggestions'])->name('ai.time-suggestions');
    Route::post('/ai/save-routine-template', [AIFeaturesController::class, 'saveRoutineTemplate'])->name('ai.save-routine-template');
    Route::post('/ai/generate-habit-suggestions', [AIFeaturesController::class, 'generateHabitSuggestions'])->name('ai.generate-habit-suggestions');
    Route::post('/ai/create-habit', [AIFeaturesController::class, 'createHabitFromSuggestion'])->name('ai.create-habit');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

