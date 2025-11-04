<?php

namespace App\Services;

use App\Models\User;
use App\Models\Habit;
use App\Models\Task;
use App\Models\Journal;
use App\Services\GeminiAIService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class SummaryGeneratorService
{
    protected $geminiService;

    public function __construct(GeminiAIService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * Generate weekly summary for a user
     */
    public function generateWeeklySummary(User $user, Carbon $startDate = null): array
    {
        try {
            $startDate = $startDate ?? Carbon::now()->startOfWeek();
            $endDate = $startDate->copy()->endOfWeek();

            // Get user's data for the week
            $data = $this->gatherWeeklyData($user, $startDate, $endDate);

            // Generate AI insights - pass user and raw data through
            $insights = $this->generateAIInsights($data, $user, $startDate, $endDate);

            return [
                'period' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d'),
                ],
                'data' => $data,
                'insights' => $insights,
                'generated_at' => now(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate weekly summary', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
            ]);
            throw $e;
        }
    }

    /**
     * Gather user's weekly data
     */
    protected function gatherWeeklyData(User $user, Carbon $startDate, Carbon $endDate): array
    {
        try {
            // Get habits with completion data
            $habits = Habit::where('user_id', $user->id)
                ->with(['completions' => function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('completed_at', [$startDate->toDateString(), $endDate->toDateString()]);
                }])
                ->get();

            // Get tasks with completion data
            $tasks = Task::where('user_id', $user->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            // Get journal entries
            $journals = Journal::where('user_id', $user->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            // Calculate metrics
            $habitMetrics = $this->calculateHabitMetrics($habits, $startDate, $endDate);
            $taskMetrics = $this->calculateTaskMetrics($tasks);
            $journalMetrics = $this->calculateJournalMetrics($journals);

            return [
                'habits' => $habitMetrics,
                'tasks' => $taskMetrics,
                'journals' => $journalMetrics,
                'overall_consistency' => $this->calculateOverallConsistency($habitMetrics, $taskMetrics),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to gather weekly data', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);
            throw $e;
        }
    }

    /**
     * Calculate habit metrics
     */
    protected function calculateHabitMetrics($habits, Carbon $startDate, Carbon $endDate): array
    {
        $totalHabits = $habits->count();
        $totalPossibleCompletions = 0;
        $totalCompletions = 0;
        $streaks = [];

        foreach ($habits as $habit) {
            $frequency = $habit->frequency ?? 'daily'; // Default to daily if null
            $daysInWeek = $startDate->diffInDays($endDate) + 1;
            
            // Calculate expected completions based on frequency
            $expectedCompletions = $this->calculateExpectedCompletions($frequency, $daysInWeek);
            $totalPossibleCompletions += $expectedCompletions;
            
            // Count actual completions
            $actualCompletions = $habit->completions->count();
            $totalCompletions += $actualCompletions;
            
            // Calculate completion rate
            $completionRate = $expectedCompletions > 0 ? ($actualCompletions / $expectedCompletions) * 100 : 0;
            
            // Calculate streak
            $streak = $this->calculateHabitStreak($habit, $endDate);
            $streaks[] = $streak;
        }

        $averageCompletionRate = $totalPossibleCompletions > 0 ? ($totalCompletions / $totalPossibleCompletions) * 100 : 0;
        $averageStreak = count($streaks) > 0 ? array_sum($streaks) / count($streaks) : 0;

        return [
            'total_habits' => $totalHabits,
            'total_completions' => $totalCompletions,
            'total_possible_completions' => $totalPossibleCompletions,
            'average_completion_rate' => round($averageCompletionRate, 2),
            'average_streak' => round($averageStreak, 1),
            'best_streak' => count($streaks) > 0 ? max($streaks) : 0,
            'completion_rates' => $habits->map(function ($habit) use ($startDate, $endDate) {
                $frequency = $habit->frequency ?? 'daily'; // Default to daily if null
                $daysInWeek = $startDate->diffInDays($endDate) + 1;
                $expectedCompletions = $this->calculateExpectedCompletions($frequency, $daysInWeek);
                $actualCompletions = $habit->completions->count();
                $completionRate = $expectedCompletions > 0 ? ($actualCompletions / $expectedCompletions) * 100 : 0;
                
                return [
                    'habit_id' => $habit->id,
                    'habit_name' => $habit->name,
                    'completion_rate' => round($completionRate, 2),
                    'streak' => $this->calculateHabitStreak($habit, $endDate),
                ];
            })->toArray(),
        ];
    }

    /**
     * Calculate task metrics
     */
    protected function calculateTaskMetrics($tasks): array
    {
        $totalTasks = $tasks->count();
        $completedTasks = $tasks->where('is_completed', true)->count();
        $completionRate = $totalTasks > 0 ? ($completedTasks / $totalTasks) * 100 : 0;

        // Group by priority
        $priorityBreakdown = $tasks->groupBy('priority')->map(function ($group) {
            $total = $group->count();
            $completed = $group->where('is_completed', true)->count();
            return [
                'total' => $total,
                'completed' => $completed,
                'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
            ];
        });

        return [
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'completion_rate' => round($completionRate, 2),
            'priority_breakdown' => $priorityBreakdown,
        ];
    }

    /**
     * Calculate journal metrics
     */
    protected function calculateJournalMetrics($journals): array
    {
        $totalEntries = $journals->count();
        $totalWords = $journals->sum(function ($journal) {
            return $journal->word_count ?? str_word_count($journal->content ?? '');
        });
        $averageWords = $totalEntries > 0 ? round($totalWords / $totalEntries) : 0;

        // Group by tags
        $tagBreakdown = $journals->flatMap(function ($journal) {
            return $journal->tags ?? [];
        })->countBy();

        return [
            'total_entries' => $totalEntries,
            'total_words' => $totalWords,
            'average_words' => $averageWords,
            'tag_breakdown' => $tagBreakdown,
        ];
    }

    /**
     * Calculate overall consistency score
     */
    protected function calculateOverallConsistency(array $habitMetrics, array $taskMetrics): float
    {
        $habitWeight = 0.6; // Habits are more important for consistency
        $taskWeight = 0.4;

        $habitScore = $habitMetrics['average_completion_rate'] ?? 0;
        $taskScore = $taskMetrics['completion_rate'] ?? 0;

        return round(($habitScore * $habitWeight) + ($taskScore * $taskWeight), 2);
    }

    /**
     * Calculate expected completions based on frequency
     */
    protected function calculateExpectedCompletions(?string $frequency, int $daysInWeek): int
    {
        $frequency = $frequency ?? 'daily'; // Default to daily if null
        
        switch ($frequency) {
            case 'daily':
                return $daysInWeek;
            case 'weekly':
                return 1;
            case 'monthly':
                return 0; // Not applicable for weekly summary
            default:
                return $daysInWeek; // Default to daily for unknown frequencies
        }
    }

    /**
     * Calculate habit streak
     */
    protected function calculateHabitStreak(Habit $habit, Carbon $endDate): int
    {
        $streak = 0;
        $currentDate = $endDate->copy();

        while ($currentDate->isAfter($habit->created_at)) {
            $hasCompletion = $habit->completions()
                ->whereDate('completed_at', $currentDate->format('Y-m-d'))
                ->exists();

            if ($hasCompletion) {
                $streak++;
                $currentDate->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Generate AI insights using Gemini
     */
    protected function generateAIInsights(array $data, User $user, Carbon $startDate, Carbon $endDate): array
    {
        try {
            // Get actual habits and tasks for context
            $habits = Habit::where('user_id', $user->id)->get();
            $tasks = Task::where('user_id', $user->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();
            
            $prompt = $this->buildSummaryPrompt($data, $habits, $tasks);
            $response = $this->geminiService->generateBookResponse($prompt, null, null, $user);
            
            return [
                'text' => $response['reply'],
                'generated_at' => now(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate AI insights', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            return [
                'text' => 'Unable to generate AI insights at this time. Please try again later.',
                'generated_at' => now(),
            ];
        }
    }

    /**
     * Build prompt for AI summary generation
     */
    protected function buildSummaryPrompt(array $data, $habits, $tasks): string
    {
        $habitMetrics = $data['habits'];
        $taskMetrics = $data['tasks'];
        $journalMetrics = $data['journals'];
        $overallConsistency = $data['overall_consistency'];

        $prompt = "Generate a personalized weekly growth summary based on the following data:\n\n";

        $prompt .= "**Habit Performance:**\n";
        $prompt .= "- Total habits: {$habitMetrics['total_habits']}\n";
        $prompt .= "- Average completion rate: {$habitMetrics['average_completion_rate']}%\n";
        $prompt .= "- Average streak: {$habitMetrics['average_streak']} days\n";
        $prompt .= "- Best streak: {$habitMetrics['best_streak']} days\n\n";

        // Add specific habits context
        if ($habits->count() > 0) {
            $prompt .= "**Active Habits:**\n";
            foreach ($habits as $habit) {
                $completionRate = $this->calculateHabitCompletionRate($habit, $data['habits']);
                $prompt .= "- {$habit->name} ({$habit->frequency}): {$completionRate}% completion rate\n";
            }
            $prompt .= "\n";
        }

        $prompt .= "**Task Completion:**\n";
        $prompt .= "- Total tasks: {$taskMetrics['total_tasks']}\n";
        $prompt .= "- Completed tasks: {$taskMetrics['completed_tasks']}\n";
        $prompt .= "- Completion rate: {$taskMetrics['completion_rate']}%\n\n";

        // Add specific tasks context
        if ($tasks->count() > 0) {
            $prompt .= "**Tasks This Week:**\n";
            $completedTasks = $tasks->where('is_completed', true);
            $incompleteTasks = $tasks->where('is_completed', false);
            
            if ($completedTasks->count() > 0) {
                $prompt .= "Completed:\n";
                foreach ($completedTasks->take(5) as $task) {
                    $prompt .= "- {$task->title} (Priority: {$task->priority})\n";
                }
                $prompt .= "\n";
            }
            
            if ($incompleteTasks->count() > 0) {
                $prompt .= "Pending:\n";
                foreach ($incompleteTasks->take(5) as $task) {
                    $prompt .= "- {$task->title} (Priority: {$task->priority})\n";
                }
                $prompt .= "\n";
            }
        }

        $prompt .= "**Journal Activity:**\n";
        $prompt .= "- Total entries: {$journalMetrics['total_entries']}\n";
        $prompt .= "- Average words per entry: {$journalMetrics['average_words']}\n\n";

        $prompt .= "**Overall Consistency Score: {$overallConsistency}%**\n\n";

        $prompt .= "Please provide:\n";
        $prompt .= "1. A brief overview of the week's performance\n";
        $prompt .= "2. Key strengths and areas for improvement\n";
        $prompt .= "3. Specific recommendations for next week based on the habits and tasks mentioned\n";
        $prompt .= "4. Motivational insights based on the data\n\n";
        $prompt .= "Keep the response concise (150-200 words), actionable, and encouraging.";

        return $prompt;
    }

    protected function calculateHabitCompletionRate($habit, $habitMetrics): float
    {
        $completionRates = $habitMetrics['completion_rates'] ?? [];
        foreach ($completionRates as $rate) {
            if ($rate['habit_id'] === $habit->id) {
                return $rate['completion_rate'];
            }
        }
        return 0;
    }
}
