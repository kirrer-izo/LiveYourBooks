<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Task;
use App\Models\Habit;
use App\Models\Journal;
use App\Models\Conversation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        
        // Basic stats
        $stats = [
            'total_books' => Book::where('user_id', $userId)->count(),
            'total_tasks' => Task::where('user_id', $userId)->count(),
            'tasks_completed' => Task::where('user_id', $userId)->where('is_completed', true)->count(),
            'tasks_pending' => Task::where('user_id', $userId)->where('is_completed', false)->count(),
            'active_habits' => Habit::where('user_id', $userId)->where('is_active', true)->count(),
            'journal_entries' => Journal::where('user_id', $userId)->count(),
            'ai_conversations' => Conversation::where('user_id', $userId)->count(),
        ];
        
        // Recent activity
        $recentBooks = Book::where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get(['id', 'title', 'author', 'updated_at']);
            
        $recentTasks = Task::where('user_id', $userId)
            ->with(['book:id,title'])
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get(['id', 'title', 'is_completed', 'priority', 'due_date', 'book_id', 'updated_at']);
            
        $recentJournals = Journal::where('user_id', $userId)
            ->orderByDesc('entry_date')
            ->limit(5)
            ->get(['id', 'title', 'entry_date', 'tags']);
        
        // Habit streaks
        $habits = Habit::where('user_id', $userId)
            ->where('is_active', true)
            ->get(['id', 'name', 'streak', 'last_completed'])
            ->map(function ($habit) {
                $habit->streak_status = $habit->getStreakStatus();
                $habit->completed_today = $habit->isCompletedToday();
                return $habit;
            });
        
        // Weekly progress data for charts
        $weeklyData = $this->getWeeklyProgressData($userId);
        
        // Books by genre
        $genreProgress = Book::where('user_id', $userId)
            ->select('genre', DB::raw('COUNT(*) as count'))
            ->groupBy('genre')
            ->get();
        
        // Task completion rate by priority
        $tasksByPriority = Task::where('user_id', $userId)
            ->select('priority', 
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed')
            )
            ->groupBy('priority')
            ->get()
            ->map(function ($item) {
                $item->completion_rate = $item->total > 0 ? round(($item->completed / $item->total) * 100, 1) : 0;
                return $item;
            });
        
        // Overdue tasks
        $overdueTasks = Task::where('user_id', $userId)
            ->where('is_completed', false)
            ->where('due_date', '<', now())
            ->with(['book:id,title'])
            ->orderBy('due_date')
            ->limit(5)
            ->get(['id', 'title', 'due_date', 'priority', 'book_id']);
        
        return inertia('dashboard', [
            'stats' => $stats,
            'recentBooks' => $recentBooks,
            'recentTasks' => $recentTasks,
            'recentJournals' => $recentJournals,
            'habits' => $habits,
            'weeklyData' => $weeklyData,
            'genreProgress' => $genreProgress,
            'tasksByPriority' => $tasksByPriority,
            'overdueTasks' => $overdueTasks,
        ]);
        
    }
    
    private function getWeeklyProgressData($userId)
    {
        $startDate = now()->subDays(6)->startOfDay();
        $endDate = now()->endOfDay();
        
        // Get daily task completions for the last 7 days
        $taskCompletions = Task::where('user_id', $userId)
            ->where('is_completed', true)
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(updated_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();
        
        // Get daily journal entries for the last 7 days
        $journalEntries = Journal::where('user_id', $userId)
            ->whereBetween('entry_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->select(DB::raw('DATE(entry_date) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();
        
        // Get habit completions for the last 7 days
        $habitCompletions = Habit::where('user_id', $userId)
            ->whereBetween('last_completed', [$startDate->toDateString(), $endDate->toDateString()])
            ->select(DB::raw('DATE(last_completed) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();
        
        // Build the weekly data array
        $weeklyData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $weeklyData[] = [
                'date' => $date,
                'day' => now()->subDays($i)->format('D'),
                'tasks_completed' => $taskCompletions[$date] ?? 0,
                'journal_entries' => $journalEntries[$date] ?? 0,
                'habits_completed' => $habitCompletions[$date] ?? 0,
            ];
        }
        
        return $weeklyData;
    }
}
