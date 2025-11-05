<?php

namespace App\Services;

use App\Models\User;
use App\Models\Habit;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ConsistencyTracker
{
    public function getUserConsistencyMetrics(User $user, int $days = 30): array
    {
        $endDate = now();
        $startDate = $endDate->copy()->subDays($days);

        return [
            'habit_consistency' => $this->calculateHabitConsistency($user, $startDate, $endDate),
            'task_completion_rate' => $this->calculateTaskCompletionRate($user, $startDate, $endDate),
            'streak_analysis' => $this->analyzeStreaks($user, $startDate, $endDate),
            'growth_trends' => $this->calculateGrowthTrends($user, $startDate, $endDate),
            'consistency_score' => $this->calculateOverallConsistencyScore($user, $startDate, $endDate),
        ];
    }

    public function calculateHabitConsistency(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $habits = Habit::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        $consistencyData = [];

        foreach ($habits as $habit) {
            $completionDays = $this->getHabitCompletionDays($habit, $startDate, $endDate);
            $totalDays = $startDate->diffInDays($endDate) + 1;
            $consistencyRate = count($completionDays) / $totalDays * 100;

            $consistencyData[] = [
                'habit_id' => $habit->id,
                'habit_name' => $habit->name,
                'completion_days' => count($completionDays),
                'total_days' => $totalDays,
                'consistency_rate' => round($consistencyRate, 2),
                'current_streak' => $this->calculateCurrentStreak($habit),
                'longest_streak' => $this->calculateLongestStreak($habit, $startDate, $endDate),
                'target_consistency' => $habit->target,
                'is_on_track' => $consistencyRate >= $habit->target,
            ];
        }

        return $consistencyData;
    }

    public function calculateTaskCompletionRate(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $tasks = Task::where('user_id', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $totalTasks = $tasks->count();
        $completedTasks = $tasks->where('is_completed', true)->count();
        $completionRate = $totalTasks > 0 ? ($completedTasks / $totalTasks) * 100 : 0;

        // Calculate completion rate by priority
        $priorityBreakdown = [];
        foreach (['low', 'medium', 'high'] as $priority) {
            $priorityTasks = $tasks->where('priority', $priority);
            $priorityCompleted = $priorityTasks->where('is_completed', true)->count();
            $priorityTotal = $priorityTasks->count();
            
            $priorityBreakdown[$priority] = [
                'total' => $priorityTotal,
                'completed' => $priorityCompleted,
                'rate' => $priorityTotal > 0 ? round(($priorityCompleted / $priorityTotal) * 100, 2) : 0,
            ];
        }

        return [
            'overall_rate' => round($completionRate, 2),
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'priority_breakdown' => $priorityBreakdown,
        ];
    }

    public function analyzeStreaks(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $habits = Habit::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        $streakAnalysis = [];

        foreach ($habits as $habit) {
            $streaks = $this->findStreaks($habit, $startDate, $endDate);
            
            $streakAnalysis[] = [
                'habit_id' => $habit->id,
                'habit_name' => $habit->name,
                'current_streak' => $this->calculateCurrentStreak($habit),
                'longest_streak' => $streaks['longest'],
                'average_streak' => $streaks['average'],
                'streak_count' => $streaks['count'],
                'consistency_pattern' => $this->analyzeConsistencyPattern($streaks['streaks']),
            ];
        }

        return $streakAnalysis;
    }

    public function calculateGrowthTrends(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $weeks = $startDate->diffInWeeks($endDate);
        $weeklyData = [];

        for ($i = 0; $i <= $weeks; $i++) {
            $weekStart = $startDate->copy()->addWeeks($i);
            $weekEnd = $weekStart->copy()->addWeek()->subDay();

            $weeklyData[] = [
                'week' => $i + 1,
                'start_date' => $weekStart->format('Y-m-d'),
                'end_date' => $weekEnd->format('Y-m-d'),
                'habit_consistency' => $this->calculateWeeklyHabitConsistency($user, $weekStart, $weekEnd),
                'task_completion' => $this->calculateWeeklyTaskCompletion($user, $weekStart, $weekEnd),
            ];
        }

        return [
            'weekly_data' => $weeklyData,
            'trend_direction' => $this->calculateTrendDirection($weeklyData),
            'improvement_areas' => $this->identifyImprovementAreas($weeklyData),
        ];
    }

    public function calculateOverallConsistencyScore(User $user, Carbon $startDate, Carbon $endDate): int
    {
        $habitConsistency = $this->calculateHabitConsistency($user, $startDate, $endDate);
        $taskCompletion = $this->calculateTaskCompletionRate($user, $startDate, $endDate);

        // Calculate weighted average
        $habitScore = collect($habitConsistency)->avg('consistency_rate') ?? 0;
        $taskScore = $taskCompletion['overall_rate'];

        // Weight habits more heavily (60%) than tasks (40%)
        $overallScore = ($habitScore * 0.6) + ($taskScore * 0.4);

        return min(100, max(0, round($overallScore)));
    }

    private function getHabitCompletionDays(Habit $habit, Carbon $startDate, Carbon $endDate): Collection
    {
        $completionDays = collect();
        $current = $startDate->copy();

        while ($current->lte($endDate)) {
            if ($habit->last_completed && $habit->last_completed->isSameDay($current)) {
                $completionDays->push($current->format('Y-m-d'));
            }
            $current->addDay();
        }

        return $completionDays;
    }

    private function calculateCurrentStreak(Habit $habit): int
    {
        if (!$habit->last_completed) {
            return 0;
        }

        $streak = 0;
        $current = now()->copy();

        while ($current->gte($habit->last_completed)) {
            if ($habit->last_completed->isSameDay($current)) {
                $streak++;
                $current->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }

    private function calculateLongestStreak(Habit $habit, Carbon $startDate, Carbon $endDate): int
    {
        $streaks = $this->findStreaks($habit, $startDate, $endDate);
        return $streaks['longest'];
    }

    private function findStreaks(Habit $habit, Carbon $startDate, Carbon $endDate): array
    {
        $completionDays = $this->getHabitCompletionDays($habit, $startDate, $endDate);
        $streaks = [];
        $currentStreak = 0;
        $longestStreak = 0;

        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            if ($completionDays->contains($current->format('Y-m-d'))) {
                $currentStreak++;
            } else {
                if ($currentStreak > 0) {
                    $streaks[] = $currentStreak;
                    $longestStreak = max($longestStreak, $currentStreak);
                }
                $currentStreak = 0;
            }
            $current->addDay();
        }

        if ($currentStreak > 0) {
            $streaks[] = $currentStreak;
            $longestStreak = max($longestStreak, $currentStreak);
        }

        return [
            'streaks' => $streaks,
            'longest' => $longestStreak,
            'average' => count($streaks) > 0 ? round(array_sum($streaks) / count($streaks), 2) : 0,
            'count' => count($streaks),
        ];
    }

    private function analyzeConsistencyPattern(array $streaks): string
    {
        if (empty($streaks)) {
            return 'no_data';
        }

        $avgStreak = array_sum($streaks) / count($streaks);
        $maxStreak = max($streaks);
        $minStreak = min($streaks);

        if ($maxStreak - $minStreak <= 2) {
            return 'consistent';
        } elseif ($avgStreak >= 7) {
            return 'strong';
        } elseif ($avgStreak >= 3) {
            return 'moderate';
        } else {
            return 'irregular';
        }
    }

    private function calculateWeeklyHabitConsistency(User $user, Carbon $startDate, Carbon $endDate): float
    {
        $habits = Habit::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        if ($habits->isEmpty()) {
            return 0;
        }

        $totalConsistency = 0;
        foreach ($habits as $habit) {
            $completionDays = $this->getHabitCompletionDays($habit, $startDate, $endDate);
            $totalDays = $startDate->diffInDays($endDate) + 1;
            $consistencyRate = count($completionDays) / $totalDays * 100;
            $totalConsistency += $consistencyRate;
        }

        return round($totalConsistency / $habits->count(), 2);
    }

    private function calculateWeeklyTaskCompletion(User $user, Carbon $startDate, Carbon $endDate): float
    {
        $tasks = Task::where('user_id', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        if ($tasks->isEmpty()) {
            return 0;
        }

        $completedTasks = $tasks->where('is_completed', true)->count();
        return round(($completedTasks / $tasks->count()) * 100, 2);
    }

    private function calculateTrendDirection(array $weeklyData): string
    {
        if (count($weeklyData) < 2) {
            return 'insufficient_data';
        }

        $firstWeek = $weeklyData[0];
        $lastWeek = end($weeklyData);

        $firstScore = ($firstWeek['habit_consistency'] + $firstWeek['task_completion']) / 2;
        $lastScore = ($lastWeek['habit_consistency'] + $lastWeek['task_completion']) / 2;

        $difference = $lastScore - $firstScore;

        if ($difference > 5) {
            return 'improving';
        } elseif ($difference < -5) {
            return 'declining';
        } else {
            return 'stable';
        }
    }

    private function identifyImprovementAreas(array $weeklyData): array
    {
        $areas = [];

        // Analyze habit consistency trend
        $habitScores = array_column($weeklyData, 'habit_consistency');
        if (count($habitScores) >= 2) {
            $habitTrend = end($habitScores) - $habitScores[0];
            if ($habitTrend < -5) {
                $areas[] = 'habit_consistency';
            }
        }

        // Analyze task completion trend
        $taskScores = array_column($weeklyData, 'task_completion');
        if (count($taskScores) >= 2) {
            $taskTrend = end($taskScores) - $taskScores[0];
            if ($taskTrend < -5) {
                $areas[] = 'task_completion';
            }
        }

        return $areas;
    }
}
