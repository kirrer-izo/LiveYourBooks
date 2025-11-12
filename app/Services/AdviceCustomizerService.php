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
        // Start with the user's primary question/goal - this is the MOST IMPORTANT part
        $prompt = "";
        
        if (!empty($goals)) {
            $prompt .= "**USER'S QUESTION/GOAL (PRIMARY FOCUS - ANSWER THIS DIRECTLY):**\n";
            foreach ($goals as $goal) {
                $prompt .= "- {$goal}\n";
            }
            $prompt .= "\n";
            $prompt .= "IMPORTANT: Your response must DIRECTLY answer the user's question above. This is the primary purpose of your advice. Use the context below only to personalize your answer, not to change the topic.\n\n";
        } else {
            $prompt = "Provide personalized advice for personal growth and development.\n\n";
        }

        // Note: Mentor/thinker context is handled by the system prompt in generateBookResponse
        // Book context is also handled there, so we focus on user-specific context here

        // Add book context if no mentor is selected (for book-based advice)
        if ($book && !$thinker && !$thinkerName) {
            $prompt .= "**Book Context (use to inform your answer):**\n";
            $prompt .= "Title: {$book->title}\n";
            if ($book->author) {
                $prompt .= "Author: {$book->author}\n";
            }
            if ($book->genre) {
                $prompt .= "Genre: {$book->genre}\n";
            }
            $prompt .= "\n";
        }

        // Add current habits with more context (for personalization only)
        if ($habits->count() > 0) {
            $prompt .= "**User's Current Habits (for context - use to personalize, not to change topic):**\n";
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
        }

        // Add incomplete tasks with more context (for personalization only)
        if ($incompleteTasks->count() > 0) {
            $prompt .= "**User's Current Tasks (for context - use to personalize, not to change topic):**\n";
            foreach ($incompleteTasks->take(5) as $task) {
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
        }

        // Add recent journal themes (for personalization only)
        if ($recentJournals->count() > 0) {
            $prompt .= "**Recent Journal Themes (for context - use to personalize, not to change topic):**\n";
            foreach ($recentJournals->take(3) as $journal) {
                $tags = $journal->tags ? implode(', ', $journal->tags) : 'No tags';
                $prompt .= "- {$journal->title} (Tags: {$tags})\n";
            }
            $prompt .= "\n";
        }

        $prompt .= "**CRITICAL INSTRUCTIONS:**\n";
        if ($thinker || $thinkerName) {
            $prompt .= "Respond as the selected mentor/thinker would. Your response MUST:\n";
        } else {
            $prompt .= "Your response MUST:\n";
        }
        $prompt .= "1. **PRIMARY: Directly answer the user's question/goal stated above. This is the main focus.**\n";
        $prompt .= "2. Provide a clear, comprehensive answer to their specific question\n";
        $prompt .= "3. Use the context (habits, tasks, journals) ONLY to personalize your answer and make it relevant to their current situation - DO NOT use it to change the topic\n";
        $prompt .= "4. Offer concrete, actionable steps they can take to achieve their goal\n";
        $prompt .= "5. Be encouraging and motivating\n";
        if ($thinker || $thinkerName) {
            $prompt .= "6. Reflect your expertise, perspective, and communication style as the selected mentor\n";
        }
        $prompt .= "\n";
        $prompt .= "Remember: The user's question/goal is the PRIMARY focus. The context is only for personalization. Keep the response focused on answering their question directly. Aim for 200-300 words to provide a thorough answer.";

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
