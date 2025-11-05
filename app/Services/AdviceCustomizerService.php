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
            // Determine the mentor name to use
            $mentorName = null;
            if ($thinker) {
                $mentorName = $thinker->getDisplayName();
            } elseif ($thinkerName) {
                $mentorName = $thinkerName;
            }
            
            // Build context for AI (without mentor context in prompt since it's handled by system prompt)
            $context = $this->buildAdviceContext($user, $thinker, $thinkerName, $book, $goals);
            
            // Generate advice using Gemini - pass mentor name and book ID so AI responds AS the mentor
            $bookId = $book ? $book->id : null;
            $response = $this->geminiService->generateBookResponse($context['prompt'], $bookId, null, $user, $mentorName);
            
            // Check if response has an error
            if (empty($response['reply']) || (isset($response['error']) && $response['error'])) {
                throw new \Exception($response['error'] ?? 'AI service returned empty response');
            }
            
            return [
                'advice' => $response['reply'],
                'thinker' => $mentorName ?: 'General Guidance',
                'book' => $book ? $book->title : null,
                'goals' => $goals,
                'generated_at' => now(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate personalized advice', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
                'thinker_id' => $thinker?->id,
                'thinker_name' => $thinkerName,
                'book_id' => $book?->id,
            ]);

            // Re-throw the exception so the controller can handle it properly
            throw $e;
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
        // Start with user's request for advice
        $prompt = "Provide personalized advice for personal growth and development based on the following context:\n\n";

        // Note: Mentor/thinker context is handled by the system prompt in generateBookResponse
        // Book context is also handled there, so we focus on user-specific context here

        // Add book context if no mentor is selected (for book-based advice)
        if ($book && !$thinker && !$thinkerName) {
            $prompt .= "**Book Context:**\n";
            $prompt .= "Title: {$book->title}\n";
            if ($book->author) {
                $prompt .= "Author: {$book->author}\n";
            }
            if ($book->genre) {
                $prompt .= "Genre: {$book->genre}\n";
            }
            $prompt .= "\n";
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
                $lastCompleted = 'Never';
                if ($habit->last_completed) {
                    try {
                        // Handle both Carbon instances and string dates
                        if ($habit->last_completed instanceof \Carbon\Carbon) {
                            $lastCompleted = $habit->last_completed->format('M d, Y');
                        } elseif (is_string($habit->last_completed)) {
                            $carbonDate = \Carbon\Carbon::parse($habit->last_completed);
                            $lastCompleted = $carbonDate->format('M d, Y');
                        }
                    } catch (\Exception $e) {
                        // If parsing fails, just use the raw value
                        $lastCompleted = $habit->last_completed;
                    }
                }
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
                $dueDate = "No due date";
                if ($task->due_date) {
                    try {
                        // Handle both Carbon instances and string dates
                        if ($task->due_date instanceof \Carbon\Carbon) {
                            $dueDate = "Due: {$task->due_date->format('M d, Y')}";
                        } elseif (is_string($task->due_date)) {
                            $carbonDate = \Carbon\Carbon::parse($task->due_date);
                            $dueDate = "Due: {$carbonDate->format('M d, Y')}";
                        }
                    } catch (\Exception $e) {
                        // If parsing fails, just use the raw value
                        $dueDate = "Due: {$task->due_date}";
                    }
                }
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
        if ($thinker || $thinkerName) {
            $prompt .= "Respond as the selected mentor/thinker would, providing personalized advice that:\n";
        } else {
            $prompt .= "Provide practical, actionable advice that:\n";
        }
        $prompt .= "1. Addresses the user's specific goals and current situation\n";
        $prompt .= "2. Is personalized based on their habits, tasks, and journal entries\n";
        $prompt .= "3. Offers concrete steps they can take immediately\n";
        $prompt .= "4. Is encouraging and motivating\n";
        if ($thinker || $thinkerName) {
            $prompt .= "5. Reflects your expertise, perspective, and communication style\n";
        } else {
            $prompt .= "5. Is practical and achievable\n";
        }
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
