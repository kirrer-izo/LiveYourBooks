<?php

namespace App\Services;

use App\Models\GrowthReport;
use App\Models\User;
use App\Models\Habit;
use App\Models\Task;
use App\Models\Journal;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class GrowthReportService
{
    public function __construct(
        private ConsistencyTracker $consistencyTracker,
        private GeminiAIService $geminiService
    ) {}

    public function generateWeeklyReport(User $user): GrowthReport
    {
        $endDate = now();
        $startDate = $endDate->copy()->subWeek();

        return $this->generateReport($user, 'weekly', $startDate, $endDate);
    }

    public function generateMonthlyReport(User $user): GrowthReport
    {
        $endDate = now();
        $startDate = $endDate->copy()->subMonth();

        return $this->generateReport($user, 'monthly', $startDate, $endDate);
    }

    public function generateReport(User $user, string $type, Carbon $startDate, Carbon $endDate): GrowthReport
    {
        // Check if report already exists
        $existingReport = GrowthReport::where('user_id', $user->id)
            ->where('report_type', $type)
            ->where('period_start', $startDate->format('Y-m-d'))
            ->first();

        if ($existingReport) {
            return $existingReport;
        }

        // Get consistency metrics
        $consistencyMetrics = $this->consistencyTracker->getUserConsistencyMetrics($user, $startDate->diffInDays($endDate));

        // Get journal entries for the period
        $journalEntries = Journal::where('user_id', $user->id)
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->orderBy('entry_date')
            ->get();

        // Create the report
        $report = GrowthReport::create([
            'user_id' => $user->id,
            'report_type' => $type,
            'period_start' => $startDate,
            'period_end' => $endDate,
            'consistency_score' => $consistencyMetrics['consistency_score'],
            'habit_metrics' => $consistencyMetrics['habit_consistency'],
            'task_metrics' => $consistencyMetrics['task_completion_rate'],
            'streak_analysis' => $consistencyMetrics['streak_analysis'],
            'growth_trends' => $consistencyMetrics['growth_trends'],
            'is_generated' => false,
        ]);

        // Generate AI insights asynchronously
        dispatch(new \App\Jobs\GenerateGrowthReportInsights($report, $journalEntries));

        return $report;
    }

    public function generateAIInsights(GrowthReport $report, $journalEntries = null): array
    {
        try {
            $user = $report->user;
            $insights = [];
            $recommendations = [];

            // Generate habit insights
            $habitInsights = $this->generateHabitInsights($report->habit_metrics, $user);
            $insights['habits'] = $habitInsights;

            // Generate task insights
            $taskInsights = $this->generateTaskInsights($report->task_metrics, $user);
            $insights['tasks'] = $taskInsights;

            // Generate streak insights
            $streakInsights = $this->generateStreakInsights($report->streak_analysis, $user);
            $insights['streaks'] = $streakInsights;

            // Generate trend insights
            $trendInsights = $this->generateTrendInsights($report->growth_trends, $user);
            $insights['trends'] = $trendInsights;

            // Generate journal insights if available
            if ($journalEntries && $journalEntries->isNotEmpty()) {
                $journalInsights = $this->generateJournalInsights($journalEntries, $user);
                $insights['journal'] = $journalInsights;
            }

            // Generate overall recommendations
            $recommendations = $this->generateRecommendations($insights, $report, $user);

            // Update the report
            $report->update([
                'ai_insights' => $insights,
                'recommendations' => $recommendations,
                'is_generated' => true,
            ]);

            return [
                'insights' => $insights,
                'recommendations' => $recommendations,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to generate AI insights for growth report', [
                'report_id' => $report->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'insights' => [],
                'recommendations' => ['Unable to generate AI insights at this time.'],
            ];
        }
    }

    private function generateHabitInsights(array $habitMetrics, User $user): array
    {
        if (empty($habitMetrics)) {
            return ['message' => 'No habit data available for this period.'];
        }

        $totalHabits = count($habitMetrics);
        $onTrackHabits = collect($habitMetrics)->where('is_on_track', true)->count();
        $averageConsistency = collect($habitMetrics)->avg('consistency_rate');

        $insights = [
            'total_habits' => $totalHabits,
            'on_track_habits' => $onTrackHabits,
            'average_consistency' => round($averageConsistency, 1),
            'top_performing_habit' => collect($habitMetrics)->sortByDesc('consistency_rate')->first(),
            'needs_attention' => collect($habitMetrics)->where('is_on_track', false)->values()->toArray(),
        ];

        if ($averageConsistency >= 80) {
            $insights['message'] = "Excellent habit consistency! You're maintaining {$onTrackHabits} out of {$totalHabits} habits on track.";
        } elseif ($averageConsistency >= 60) {
            $insights['message'] = "Good habit consistency. You're on track with {$onTrackHabits} out of {$totalHabits} habits.";
        } else {
            $insights['message'] = "Your habit consistency could use improvement. Only {$onTrackHabits} out of {$totalHabits} habits are on track.";
        }

        return $insights;
    }

    private function generateTaskInsights(array $taskMetrics, User $user): array
    {
        $insights = [
            'completion_rate' => $taskMetrics['overall_rate'],
            'total_tasks' => $taskMetrics['total_tasks'],
            'completed_tasks' => $taskMetrics['completed_tasks'],
            'priority_breakdown' => $taskMetrics['priority_breakdown'],
        ];

        $completionRate = $taskMetrics['overall_rate'];

        if ($completionRate >= 80) {
            $insights['message'] = "Outstanding task completion! You completed {$taskMetrics['completed_tasks']} out of {$taskMetrics['total_tasks']} tasks.";
        } elseif ($completionRate >= 60) {
            $insights['message'] = "Good task completion rate. You completed {$taskMetrics['completed_tasks']} out of {$taskMetrics['total_tasks']} tasks.";
        } else {
            $insights['message'] = "Your task completion rate could be improved. You completed {$taskMetrics['completed_tasks']} out of {$taskMetrics['total_tasks']} tasks.";
        }

        return $insights;
    }

    private function generateStreakInsights(array $streakAnalysis, User $user): array
    {
        if (empty($streakAnalysis)) {
            return ['message' => 'No streak data available for this period.'];
        }

        $totalHabits = count($streakAnalysis);
        $averageStreak = collect($streakAnalysis)->avg('current_streak');
        $longestStreak = collect($streakAnalysis)->max('longest_streak');

        $insights = [
            'total_habits' => $totalHabits,
            'average_current_streak' => round($averageStreak, 1),
            'longest_streak' => $longestStreak,
            'consistency_patterns' => collect($streakAnalysis)->pluck('consistency_pattern')->countBy()->toArray(),
        ];

        if ($averageStreak >= 7) {
            $insights['message'] = "Amazing streak consistency! Your average streak is {$averageStreak} days.";
        } elseif ($averageStreak >= 3) {
            $insights['message'] = "Good streak consistency. Your average streak is {$averageStreak} days.";
        } else {
            $insights['message'] = "Your streaks could be more consistent. Your average streak is {$averageStreak} days.";
        }

        return $insights;
    }

    private function generateTrendInsights(array $growthTrends, User $user): array
    {
        $insights = [
            'trend_direction' => $growthTrends['trend_direction'],
            'improvement_areas' => $growthTrends['improvement_areas'],
            'weekly_data' => $growthTrends['weekly_data'],
        ];

        switch ($growthTrends['trend_direction']) {
            case 'improving':
                $insights['message'] = "Great progress! Your consistency is improving over time.";
                break;
            case 'declining':
                $insights['message'] = "Your consistency has declined recently. Focus on the areas that need improvement.";
                break;
            case 'stable':
                $insights['message'] = "Your consistency has remained stable. Consider setting new challenges to grow further.";
                break;
            default:
                $insights['message'] = "Insufficient data to determine trends. Keep tracking your progress!";
        }

        return $insights;
    }

    private function generateJournalInsights($journalEntries, User $user): array
    {
        $totalEntries = $journalEntries->count();
        $avgEntryLength = $journalEntries->avg(fn($entry) => strlen($entry->content));

        $insights = [
            'total_entries' => $totalEntries,
            'average_entry_length' => round($avgEntryLength),
            'reflection_frequency' => $this->calculateReflectionFrequency($journalEntries),
        ];

        if ($totalEntries >= 5) {
            $insights['message'] = "Great journaling consistency! You wrote {$totalEntries} entries this period.";
        } elseif ($totalEntries >= 2) {
            $insights['message'] = "Good journaling habit. You wrote {$totalEntries} entries this period.";
        } else {
            $insights['message'] = "Consider journaling more regularly. You wrote {$totalEntries} entries this period.";
        }

        return $insights;
    }

    private function generateRecommendations(array $insights, GrowthReport $report, User $user): array
    {
        $recommendations = [];

        // Habit recommendations
        if (isset($insights['habits']['needs_attention']) && !empty($insights['habits']['needs_attention'])) {
            $recommendations[] = "Focus on improving consistency for: " . 
                implode(', ', array_column($insights['habits']['needs_attention'], 'habit_name'));
        }

        // Task recommendations
        if ($insights['tasks']['completion_rate'] < 70) {
            $recommendations[] = "Consider breaking down large tasks into smaller, more manageable pieces.";
        }

        // Streak recommendations
        if ($insights['streaks']['average_current_streak'] < 3) {
            $recommendations[] = "Try to maintain at least a 3-day streak for your habits to build momentum.";
        }

        // Trend recommendations
        if ($insights['trends']['trend_direction'] === 'declining') {
            $recommendations[] = "Focus on one area at a time to reverse the declining trend.";
        }

        // Journal recommendations
        if (isset($insights['journal']) && $insights['journal']['total_entries'] < 3) {
            $recommendations[] = "Try journaling at least 3 times per week to track your progress and insights.";
        }

        // General recommendations based on consistency score
        if ($report->consistency_score < 60) {
            $recommendations[] = "Start with just one habit or task and focus on consistency before adding more.";
        } elseif ($report->consistency_score >= 80) {
            $recommendations[] = "You're doing great! Consider adding a new challenge or increasing the difficulty of existing habits.";
        }

        return array_unique($recommendations);
    }

    private function calculateReflectionFrequency($journalEntries): string
    {
        $totalDays = $journalEntries->groupBy('entry_date')->count();
        $periodDays = 7; // Assuming weekly report

        $frequency = $totalDays / $periodDays;

        if ($frequency >= 0.7) return 'high';
        if ($frequency >= 0.3) return 'medium';
        return 'low';
    }
}
