<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AIChatController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the " middleware group. Make something great!
|
*/

// Your API routes go here
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

Route::post('/mentor-chat', [AIChatController::class, 'chat'])
    ->name('mentor.chat');

// Conversations APIs
Route::middleware(['auth'])->group(function () {
    Route::get('/conversations', [AIChatController::class, 'conversations'])
        ->name('conversations.list');
    Route::get('/conversations/{id}', [AIChatController::class, 'conversation'])
        ->name('conversations.show');
    Route::put('/conversations/{id}', [AIChatController::class, 'updateConversation'])
        ->name('conversations.update');
    Route::delete('/conversations/{id}', [AIChatController::class, 'deleteConversation'])
        ->name('conversations.delete');

    Route::post('/journals/from-reply', [AIChatController::class, 'saveJournal'])
        ->name('journals.from_reply');

    Route::post('/tasks/from-reply', [AIChatController::class, 'tasksFromReply'])
        ->name('tasks.from_reply');

    Route::post('/books/{book_id}/generate-tasks', [AIChatController::class, 'generateTaskSuggestions'])
        ->name('books.generate_tasks');

    // Quick create endpoints for mentor chat
    Route::post('/quick-create-book', [AIChatController::class, 'quickCreateBook'])
        ->name('quick.create.book');
    
    Route::post('/quick-create-mentor', [AIChatController::class, 'quickCreateMentor'])
        ->name('quick.create.mentor');
});