<?php

use App\Http\Controllers\Admin\AdminBookCatalogController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminIntegrationController;
use App\Http\Controllers\Admin\AdminBookController;
use App\Http\Controllers\Admin\AdminUserController;
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
use App\Enums\UserRole;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Public dashboard route - redirects to auth dashboard if logged in
Route::get('/dashboard', function () {
    if (! auth()->check()) {
        return redirect()->route('login');
    }

    if (auth()->user()?->role === UserRole::Admin->value) {
        return redirect()->route('admin.dashboard');
    }

    return app(\App\Http\Controllers\DashboardController::class)->index();
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

    // Quick create endpoints for mentor chat
    Route::post('/api/quick-create-book', [AIChatController::class, 'quickCreateBook'])
        ->name('quick.create.book')
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:30,1');
    
    Route::post('/api/quick-create-mentor', [AIChatController::class, 'quickCreateMentor'])
        ->name('quick.create.mentor')
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:30,1');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('admin')
        ->name('admin.')
        ->middleware('role:admin')
        ->group(function () {
            Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

            Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
            Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
            Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
            Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');

            Route::resource('books', AdminBookController::class);
            Route::get('/books', [AdminBookController::class, 'index'])->name('books.index');
            Route::post('/books', [AdminBookController::class, 'store'])->name('books.store');
            Route::put('/books/{book}', [AdminBookController::class, 'update'])->name('books.update');
            Route::delete('/books/{book}', [AdminBookController::class, 'destroy'])->name('books.destroy');

            Route::get('/integrations', [AdminIntegrationController::class, 'index'])->name('integrations.index');
            Route::post('/integrations', [AdminIntegrationController::class, 'store'])->name('integrations.store');
            Route::put('/integrations/{integrationSetting}', [AdminIntegrationController::class, 'update'])->name('integrations.update');
            Route::delete('/integrations/{integrationSetting}', [AdminIntegrationController::class, 'destroy'])->name('integrations.destroy');
        });

    // Resource routes
    Route::resource('books', BookController::class);
    // Allow POST for book updates when files are present (method spoofing)
    Route::post('/books/{book}', [BookController::class, 'update'])->name('books.update.post');
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
    
    // Notification preferences (API routes)
    Route::get('/api/notifications/preferences', [NotificationController::class, 'getPreferences'])->name('notifications.preferences');
    Route::get('/api/notifications', [NotificationController::class, 'getNotifications'])->name('notifications.list');
    Route::post('/api/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.mark_read');
    Route::post('/api/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark_all_read');
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
        
        // Get thinkers from ThinkerType enum (predefined)
        $thinkerTypes = \App\Enums\ThinkerType::getPredefinedThinkers();
        $thinkerNames = array_map(fn($type) => $type->getDisplayName(), $thinkerTypes);
        
        // Get custom thinkers (mentors) created by user
        $customThinkers = \App\Models\Thinker::where('user_id', \Illuminate\Support\Facades\Auth::id())
            ->where('type', \App\Enums\ThinkerType::CUSTOM)
            ->where('is_active', true)
            ->whereNotNull('name')
            ->pluck('name')
            ->toArray();
        
        // Combine and sort all authors/thinkers
        $mentorNames = array_unique(array_merge($bookAuthors, $thinkerNames, $customThinkers));
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

Route::middleware(['auth', 'verified', 'role'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::post('/users/{user}/toggle', [AdminUserController::class, 'toggle'])->name('users.toggle');

    Route::get('/catalog', [AdminBookCatalogController::class, 'index'])->name('catalog.index');
    Route::post('/catalog', [AdminBookCatalogController::class, 'store'])->name('catalog.store');
    Route::put('/catalog/{entry}', [AdminBookCatalogController::class, 'update'])->name('catalog.update');
    Route::delete('/catalog/{entry}', [AdminBookCatalogController::class, 'destroy'])->name('catalog.destroy');

    Route::get('/integrations', [AdminIntegrationController::class, 'index'])->name('integrations.index');
    Route::put('/integrations/{integration}', [AdminIntegrationController::class, 'update'])->name('integrations.update');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

