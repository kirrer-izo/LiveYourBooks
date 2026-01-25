<?php

use App\Enums\UserRole;
use App\Http\Controllers\Admin\AdminBookCatalogController;
use App\Http\Controllers\Admin\AdminBookController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminIntegrationController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\AIChatController;
use App\Http\Controllers\AIFeaturesController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HabitController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ThinkerController;
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

    return app(DashboardController::class)->index();
})->name('dashboard');

// Public routes will be handled in auth middleware group below

// AI Chat endpoint

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('admin')
        ->name('admin.')
        ->middleware('role:admin')
        ->group(function () {
            Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

            Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
            Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
            Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
            Route::post('/users/{user}/toggle', [AdminUserController::class, 'toggle'])->name('users.toggle');
            Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');

            Route::resource('books', AdminBookController::class);
            // Route::get('/books', [AdminBookController::class, 'index'])->name('books.index');
            // Route::post('/books', [AdminBookController::class, 'store'])->name('books.store');
            Route::post('/books/bulk', [AdminBookController::class, 'bulkStore'])->name('books.bulk');
            // // Route::put('/books/{book}', [AdminBookController::class, 'update'])->name('books.update');
            // Route::delete('/books/{book}', [AdminBookController::class, 'destroy'])->name('books.destroy');

            Route::get('/integrations', [AdminIntegrationController::class, 'index'])->name('integrations.index');
            Route::post('/integrations', [AdminIntegrationController::class, 'store'])->name('integrations.store');
            Route::put('/integrations/{integrationSetting}', [AdminIntegrationController::class, 'update'])->name('integrations.update');
            Route::delete('/integrations/{integrationSetting}', [AdminIntegrationController::class, 'destroy'])->name('integrations.destroy');

            Route::get('/catalog', [AdminBookCatalogController::class, 'index'])->name('catalog.index');
            Route::post('/catalog', [AdminBookCatalogController::class, 'store'])->name('catalog.store');
            Route::put('/catalog/{entry}', [AdminBookCatalogController::class, 'update'])->name('catalog.update');
            Route::delete('/catalog/{entry}', [AdminBookCatalogController::class, 'destroy'])->name('catalog.destroy');
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
            ->select('id', 'title', 'author', 'created_at')
            ->orderByDesc('created_at')
            ->get();

        $mentors = [];

        // 1. Authors from books
        $bookAuthors = \App\Models\Book::where('user_id', \Illuminate\Support\Facades\Auth::id())
            ->whereNotNull('author')
            ->where('author', '!=', '')
            ->distinct()
            ->pluck('author');

        foreach ($bookAuthors as $author) {
            $mentors[] = [
                'id' => 'author_'.md5($author),
                'name' => $author,
                'type' => 'author',
                'avatar' => null,
            ];
        }

        // 2. Predefined Thinkers
        $thinkerTypes = \App\Enums\ThinkerType::getPredefinedThinkers();
        foreach ($thinkerTypes as $type) {
            $mentors[] = [
                'id' => 'predefined_'.$type->value,
                'name' => $type->getDisplayName(),
                'type' => 'thinker',
                'avatar' => null, // Could map valid predefined avatars here if available
            ];
        }

        // 3. Custom Thinkers (Mentors)
        $customThinkers = \App\Models\Thinker::where('user_id', \Illuminate\Support\Facades\Auth::id())
            ->where('type', \App\Enums\ThinkerType::CUSTOM)
            ->where('is_active', true)
            ->get();

        foreach ($customThinkers as $thinker) {
            $mentors[] = [
                'id' => $thinker->id, // numeric ID
                'name' => $thinker->name,
                'type' => 'custom',
                'description' => $thinker->description,
                'avatar' => null,
            ];
        }

        // Sort by name
        usort($mentors, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return Inertia::render('Mentor/Chat', [
            'books' => $books,
            'mentors' => $mentors,
        ]);
    })->name('mentor.chat.ui');

    Route::post('/mentor/chat/message', [AIChatController::class, 'chat'])->name('mentor.chat.message');

    // Analytics page
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics');

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
    Route::post('/ai/book-suggestions', [AIFeaturesController::class, 'generateBookSuggestions'])->name('ai.book-suggestions');

    Route::post('/ai/disclaimer/agree', function () {
        $user = auth()->user();
        $user->update(['ai_disclaimer_agreed_at' => now()]);

        return back()->with('success', 'AI Disclaimer agreed successfully.');
    })->name('ai.disclaimer.agree');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
