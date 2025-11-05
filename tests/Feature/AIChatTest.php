<?php

use App\Models\User;
use App\Models\Book;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Task;
use App\Models\Journal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->book = Book::factory()->create(['user_id' => $this->user->id]);
});

test('user can access mentor chat page', function () {
    $response = $this->actingAs($this->user)
        ->get('/mentor/chat');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Mentor/Chat')
        ->has('books')
        ->has('mentors')
    );
});

test('user can create journal from chat reply', function () {
    $conversation = Conversation::factory()->create([
        'user_id' => $this->user->id,
        'book_id' => $this->book->id,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson('/api/journals/from-reply', [
            'conversation_id' => $conversation->id,
            'content' => 'This is a test journal entry from AI chat.',
            'title' => 'Test Journal Entry',
        ]);

    $response->assertStatus(200);
    $response->assertJsonStructure(['journal_id']);

    $this->assertDatabaseHas('journals', [
        'user_id' => $this->user->id,
        'title' => 'Test Journal Entry',
        'content' => 'This is a test journal entry from AI chat.',
    ]);
});

test('user can create tasks from chat reply', function () {
    $conversation = Conversation::factory()->create([
        'user_id' => $this->user->id,
        'book_id' => $this->book->id,
    ]);

    $content = "Here are some tasks:\n1. Read chapter 1\n2. Take notes\n3. Practice exercises";

    $response = $this->actingAs($this->user)
        ->postJson('/api/tasks/from-reply', [
            'conversation_id' => $conversation->id,
            'content' => $content,
            'book_id' => $this->book->id,
        ]);

    $response->assertStatus(200);
    $response->assertJsonStructure(['created']);

    // Should create 3 tasks
    $this->assertEquals(3, Task::where('user_id', $this->user->id)->count());
    
    $this->assertDatabaseHas('tasks', [
        'user_id' => $this->user->id,
        'title' => 'Read chapter 1',
        'book_id' => $this->book->id,
    ]);
});

test('user can generate AI task suggestions from book', function () {
    // Mock the OpenAI API response
    Http::fake([
        'api.openai.com/*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => "1. Practice daily meditation for 10 minutes\n2. Write in gratitude journal\n3. Read one chapter per day\n4. Apply key concepts in daily life\n5. Share insights with others"
                    ]
                ]
            ]
        ], 200)
    ]);

    $response = $this->actingAs($this->user)
        ->postJson("/api/books/{$this->book->id}/generate-tasks", [
            'book_id' => $this->book->id,
        ]);

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'message',
        'tasks_created',
        'suggestions',
        'tasks'
    ]);

    // Should create 5 tasks
    $this->assertEquals(5, Task::where('user_id', $this->user->id)->count());
});

test('unauthorized user cannot access chat endpoints', function () {
    $response = $this->postJson('/api/mentor-chat', [
        'message' => 'Hello',
    ]);

    $response->assertStatus(401);
});

test('user can view conversation history', function () {
    $conversation = Conversation::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'Test Conversation',
    ]);

    Message::factory()->create([
        'conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'Hello',
    ]);

    Message::factory()->create([
        'conversation_id' => $conversation->id,
        'role' => 'assistant',
        'content' => 'Hi there!',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/conversations');

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'conversations' => [
            '*' => ['id', 'title', 'last_message_at', 'updated_at']
        ]
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/api/conversations/{$conversation->id}");

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'conversation' => ['id', 'title', 'last_message_at'],
        'messages' => [
            '*' => ['role', 'content', 'created_at']
        ]
    ]);
});
