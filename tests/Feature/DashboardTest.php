<?php

use App\Models\User;
use App\Models\Book;
use App\Models\Task;
use App\Models\Habit;
use App\Models\Journal;
use App\Models\Conversation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('dashboard can be rendered', function () {
    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('stats')
        ->has('recentBooks')
        ->has('recentTasks')
        ->has('recentJournals')
        ->has('habits')
        ->has('weeklyData')
        ->has('genreProgress')
        ->has('tasksByPriority')
        ->has('overdueTasks')
    );
});

test('dashboard displays correct statistics', function () {
    // Create test data
    $completedBooks = Book::factory()->count(3)->create(['user_id' => $this->user->id, 'is_completed' => true]);
    $readingBooks = Book::factory()->count(2)->create(['user_id' => $this->user->id, 'is_completed' => false]);
    
    Task::factory()->count(5)->create(['user_id' => $this->user->id, 'is_completed' => true]);
    Task::factory()->count(3)->create(['user_id' => $this->user->id, 'is_completed' => false]);
    
    Habit::factory()->count(4)->create(['user_id' => $this->user->id, 'is_active' => true]);
    Journal::factory()->count(6)->create(['user_id' => $this->user->id]);
    
    // Reuse existing books for conversations to avoid creating new ones
    Conversation::factory()->count(2)->create([
        'user_id' => $this->user->id,
        'book_id' => $completedBooks->first()->id
    ]);

    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->where('stats.total_books', 5)
        ->where('stats.books_completed', 3)
        ->where('stats.books_reading', 2)
        ->where('stats.total_tasks', 8)
        ->where('stats.tasks_completed', 5)
        ->where('stats.tasks_pending', 3)
        ->where('stats.active_habits', 4)
        ->where('stats.journal_entries', 6)
        ->where('stats.ai_conversations', 2)
    );
});

test('dashboard shows recent activity', function () {
    $book = Book::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'Recent Book',
        'updated_at' => now(),
    ]);

    $task = Task::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'Recent Task',
        'updated_at' => now(),
    ]);

    $journal = Journal::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'Recent Journal',
        'entry_date' => now()->toDateString(),
    ]);

    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->where('recentBooks.0.title', 'Recent Book')
        ->where('recentTasks.0.title', 'Recent Task')
        ->where('recentJournals.0.title', 'Recent Journal')
    );
});

test('dashboard shows overdue tasks', function () {
    $overdueTask = Task::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'Overdue Task',
        'is_completed' => false,
        'due_date' => now()->subDays(2),
    ]);

    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->where('overdueTasks.0.title', 'Overdue Task')
    );
});

test('dashboard calculates weekly progress data', function () {
    // Create tasks completed in the last week
    Task::factory()->create([
        'user_id' => $this->user->id,
        'is_completed' => true,
        'updated_at' => now()->subDays(1),
    ]);

    // Create journal entries
    Journal::factory()->create([
        'user_id' => $this->user->id,
        'entry_date' => now()->subDays(1)->toDateString(),
    ]);

    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->has('weeklyData', 7) // Should have 7 days of data
        ->where('weeklyData.5.tasks_completed', 1) // Index 5 is yesterday (6 days ago to today)
        ->where('weeklyData.5.journal_entries', 1) // Index 5 is yesterday
    );
});

test('dashboard shows habit streaks', function () {
    $habit = Habit::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Daily Reading',
        'is_active' => true,
        'streak' => 5,
        'last_completed' => now()->toDateString(),
    ]);

    $response = $this->actingAs($this->user)
        ->get('/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->where('habits.0.name', 'Daily Reading')
        ->where('habits.0.streak', 5)
    );
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('dashboard'))->assertOk();
});