<?php

namespace App\Services;

use App\Models\User;
use App\Models\Thinker;
use App\Models\Book;
use App\Services\GeminiAIService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class AdviceCustomizerService
{
    protected $geminiService;

    public function __construct(GeminiAIService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * Generate personalized advice based on thinker and user context
     */
    public function generateAdvice(User $user, ?Thinker $thinker = null, ?string $thinkerName = null, ?Book $book = null, array $goals = []): array
    {
        try {
            // Build context for AI
            $context = $this->buildAdviceContext($user, $thinker, $thinkerName, $book, $goals);
            
            // Generate advice using Gemini - pass user explicitly
            $response = $this->geminiService->generateBookResponse($context['prompt'], null, null, $user);
            
            return [
                'advice' => $response['reply'],
                'thinker' => $thinker ? $thinker->getDisplayName() : ($thinkerName ?: 'General Guidance'),
                'book' => $book ? $book->title : null,
                'goals' => $goals,
                'generated_at' => now(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate personalized advice', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'thinker_id' => $thinker?->id,
                'thinker_name' => $thinkerName,
                'book_id' => $book?->id,
            ]);

            return [
                'advice' => 'Unable to generate personalized advice at this time. Please try again later.',
                'thinker' => $thinker ? $thinker->getDisplayName() : ($thinkerName ?: 'General Guidance'),
                'book' => $book ? $book->title : null,
                'goals' => $goals,
                'generated_at' => now(),
            ];
        }
    }

    /**
     * Build context for advice generation
     */
    protected function buildAdviceContext(User $user, ?Thinker $thinker, ?string $thinkerName, ?Book $book, array $goals): array
    {
        // Get user's current habits and tasks
        $habits = $user->habits()->where('is_active', true)->get();
        $incompleteTasks = $user->tasks()->where('is_completed', false)->get();
        $recentJournals = $user->journals()->latest()->limit(5)->get();

        // Build the prompt
        $prompt = $this->buildAdvicePrompt($user, $thinker, $thinkerName, $book, $goals, $habits, $incompleteTasks, $recentJournals);

        return [
            'prompt' => $prompt,
            'user_context' => [
                'habits' => $habits->count(),
                'incomplete_tasks' => $incompleteTasks->count(),
                'recent_journals' => $recentJournals->count(),
            ],
        ];
    }

    /**
     * Build the AI prompt for advice generation
     */
    protected function buildAdvicePrompt(User $user, ?Thinker $thinker, ?string $thinkerName, ?Book $book, array $goals, $habits, $incompleteTasks, $recentJournals): string
    {
        $prompt = "Generate personalized advice for personal growth and development.\n\n";

        // Add thinker context
        if ($thinker) {
            $prompt .= "**Thinker Context:**\n";
            $prompt .= "You are providing advice in the style of {$thinker->getDisplayName()}.\n";
            $prompt .= "Philosophy/Approach: {$thinker->getDescription()}\n";
            $prompt .= "Advice Style: {$thinker->getAdviceStyle()}\n\n";
        } elseif ($thinkerName) {
            $prompt .= "**Thinker Context:**\n";
            $prompt .= "You are providing advice in the style of {$thinkerName}.\n";
            $prompt .= "Provide advice that reflects their philosophy and approach.\n\n";
        }

        // Add book context
        if ($book) {
            $prompt .= "**Book Context:**\n";
            $prompt .= "Title: {$book->title}\n";
            $prompt .= "Author: {$book->author}\n";
            $prompt .= "Genre: {$book->genre}\n\n";
        }

        // Add user goals
        if (!empty($goals)) {
            $prompt .= "**User Goals:**\n";
            foreach ($goals as $goal) {
                $prompt .= "- {$goal}\n";
            }
            $prompt .= "\n";
        }

        // Add current habits with more context
        if ($habits->count() > 0) {
            $prompt .= "**Current Active Habits:**\n";
            foreach ($habits as $habit) {
                $streak = $habit->streak ?? 0;
                $lastCompleted = $habit->last_completed ? $habit->last_completed->format('M d, Y') : 'Never';
                $prompt .= "- {$habit->name} ({$habit->frequency}): Current streak: {$streak} days, Last completed: {$lastCompleted}\n";
            }
            $prompt .= "\n";
        } else {
            $prompt .= "**Current Active Habits:** None\n\n";
        }

        // Add incomplete tasks with more context
        if ($incompleteTasks->count() > 0) {
            $prompt .= "**Current Incomplete Tasks:**\n";
            foreach ($incompleteTasks->take(10) as $task) {
                $dueDate = $task->due_date ? "Due: {$task->due_date->format('M d, Y')}" : "No due date";
                $prompt .= "- {$task->title} (Priority: {$task->priority}, {$dueDate})";
                if ($task->description) {
                    $prompt .= " - " . substr($task->description, 0, 100);
                }
                $prompt .= "\n";
            }
            $prompt .= "\n";
        } else {
            $prompt .= "**Current Incomplete Tasks:** None\n\n";
        }

        // Add recent journal themes
        if ($recentJournals->count() > 0) {
            $prompt .= "**Recent Journal Themes:**\n";
            foreach ($recentJournals as $journal) {
                $tags = $journal->tags ? implode(', ', $journal->tags) : 'No tags';
                $prompt .= "- {$journal->title} (Tags: {$tags})\n";
            }
            $prompt .= "\n";
        }

        $prompt .= "**Instructions:**\n";
        $prompt .= "Provide practical, actionable advice that:\n";
        $prompt .= "1. Addresses the user's specific goals and current situation\n";
        $prompt .= "2. Is personalized based on their habits, tasks, and journal entries\n";
        $prompt .= "3. Offers concrete steps they can take immediately\n";
        $prompt .= "4. Is encouraging and motivating\n";
        $prompt .= "5. Aligns with the thinker's philosophy (if specified)\n";
        $prompt .= "6. Is practical and achievable\n\n";
        $prompt .= "Keep the response focused, actionable, and inspiring. Aim for 150-200 words.";

        return $prompt;
    }

    /**
     * Generate advice based on specific life area
     */
    public function generateLifeAreaAdvice(User $user, string $lifeArea, ?Thinker $thinker = null, ?string $thinkerName = null): array
    {
        $goals = $this->extractGoalsFromLifeArea($lifeArea);
        return $this->generateAdvice($user, $thinker, $thinkerName, null, $goals);
    }

    /**
     * Generate advice based on book content
     */
    public function generateBookAdvice(User $user, Book $book, ?Thinker $thinker = null): array
    {
        return $this->generateAdvice($user, $thinker, null, $book, []);
    }

    /**
     * Extract goals based on life area
     */
    protected function extractGoalsFromLifeArea(string $lifeArea): array
    {
        $goals = [
            'health' => [
                'Improve physical fitness and energy levels',
                'Develop sustainable healthy habits',
                'Enhance mental and emotional well-being',
            ],
            'career' => [
                'Advance professional skills and knowledge',
                'Increase productivity and efficiency',
                'Build meaningful professional relationships',
            ],
            'relationships' => [
                'Strengthen personal relationships',
                'Improve communication skills',
                'Build deeper connections with others',
            ],
            'personal_growth' => [
                'Develop self-awareness and emotional intelligence',
                'Cultivate mindfulness and presence',
                'Build resilience and adaptability',
            ],
            'learning' => [
                'Expand knowledge and skills',
                'Develop critical thinking abilities',
                'Stay curious and open to new ideas',
            ],
        ];

        return $goals[$lifeArea] ?? ['Focus on personal development and growth'];
    }
}
