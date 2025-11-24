<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Task;
use App\Models\Habit;
use App\Models\HabitCompletion;
use App\Models\Journal;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        // Books statistics
        $booksStats = [
            'total' => (int) Book::where('user_id', $userId)->count(),
            'completed' => (int) Book::where('user_id', $userId)->where('is_completed', true)->count(),
            'in_progress' => (int) Book::where('user_id', $userId)->where('is_completed', false)->count(),
        ];

        // Habit consistency: derive a simple percentage from last_completed recency and streak
        $habits = Habit::where('user_id', $userId)
            ->where('is_active', true)
            ->get(['id','name','streak','last_completed']);

        $habitConsistency = $habits->map(function ($habit) {
            $daysSince = $habit->last_completed ? now()->diffInDays($habit->last_completed) : 365;
            // Heuristic: higher streak and recent completion => higher consistency
            $base = min($habit->streak * 5, 60); // up to 60% from streak
            $recency = max(0, 40 - min($daysSince, 40)); // up to 40% if completed today (0 days)
            $percent = max(0, min(100, $base + $recency));
            return [
                'name' => $habit->name,
                'percent' => (int) round($percent),
            ];
        })->values();

        // Weekly progress (reuse logic similar to DashboardController)
        $startDate = now()->subDays(6)->startOfDay();
        $endDate = now()->endOfDay();

        $taskCompletions = Task::where('user_id', $userId)
            ->where('is_completed', true)
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(updated_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $journalEntries = Journal::where('user_id', $userId)
            ->whereBetween('entry_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->select(DB::raw('DATE(entry_date) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $habitCompletions = HabitCompletion::join('habits', 'habit_completions.habit_id', '=', 'habits.id')
            ->where('habits.user_id', $userId)
            ->whereBetween('habit_completions.completed_at', [$startDate->toDateString(), $endDate->toDateString()])
            ->select(DB::raw('DATE(habit_completions.completed_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

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

        // Simple achievements
        $achievements = [
            [ 'icon' => 'zap', 'label' => '7-Day Streak', 'desc' => 'Consistent for a week', 'unlocked' => $habits->max('streak') >= 7 ],
            [ 'icon' => 'edit', 'label' => 'Reflective', 'desc' => '10 journal entries', 'unlocked' => Journal::where('user_id', $userId)->count() >= 10 ],
            [ 'icon' => 'check-circle', 'label' => 'Task Master', 'desc' => 'Completed 20 tasks', 'unlocked' => Task::where('user_id', $userId)->where('is_completed', true)->count() >= 20 ],
        ];

        return inertia('Analytics/Index', [
            'booksStats' => $booksStats,
            'habitConsistency' => $habitConsistency,
            'weeklyData' => $weeklyData,
            'achievements' => $achievements,
        ]);
    }
}
