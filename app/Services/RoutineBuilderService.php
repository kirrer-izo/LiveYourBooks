<?php

namespace App\Services;

use App\Models\User;
use App\Models\Habit;
use App\Models\Task;
use App\Services\GeminiAIService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RoutineBuilderService
{
    protected $geminiService;

    public function __construct(GeminiAIService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * Generate a personalized daily routine
     */
    public function generateDailyRoutine(User $user, array $preferences = []): array
    {
        try {
            // Get user's context
            $context = $this->buildRoutineContext($user, $preferences);
            
            // Generate routine using AI - pass user explicitly
            $response = $this->geminiService->generateBookResponse($context['prompt'], null, null, $user);
            
            // Parse the AI response into structured routine
            $routine = $this->parseRoutineResponse($response['reply'], $preferences);
            
            return [
                'time_blocks' => $routine['time_blocks'] ?? [],
                'preferences' => $preferences,
                'generated_at' => now(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate daily routine', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'preferences' => $preferences,
            ]);

            // Return default routine if AI fails
            $defaultRoutine = $this->getDefaultRoutine($preferences);
            return [
                'time_blocks' => $defaultRoutine['time_blocks'] ?? [],
                'preferences' => $preferences,
                'generated_at' => now(),
            ];
        }
    }

    /**
     * Build context for routine generation
     */
    protected function buildRoutineContext(User $user, array $preferences): array
    {
        // Get user's habits and tasks
        $habits = $user->habits()->where('is_active', true)->get();
        $tasks = $user->tasks()->where('is_completed', false)->get();

        // Build the prompt
        $prompt = $this->buildRoutinePrompt($user, $habits, $tasks, $preferences);

        return [
            'prompt' => $prompt,
            'habits' => $habits,
            'tasks' => $tasks,
        ];
    }

    /**
     * Build the AI prompt for routine generation
     */
    protected function buildRoutinePrompt(User $user, $habits, $tasks, array $preferences): string
    {
        $prompt = "Generate a personalized daily routine for personal growth and productivity.\n\n";

        // Add user preferences
        if (!empty($preferences)) {
            $prompt .= "**User Preferences:**\n";
            if (isset($preferences['wake_up_time'])) {
                $prompt .= "- Wake up time: {$preferences['wake_up_time']}\n";
            }
            if (isset($preferences['sleep_time'])) {
                $prompt .= "- Sleep time: {$preferences['sleep_time']}\n";
            }
            if (isset($preferences['work_hours'])) {
                $prompt .= "- Work hours: {$preferences['work_hours']}\n";
            }
            if (isset($preferences['focus_areas'])) {
                $prompt .= "- Focus areas: " . implode(', ', $preferences['focus_areas']) . "\n";
            }
            $prompt .= "\n";
        }

        // Add current habits with more context
        if ($habits->count() > 0) {
            $prompt .= "**Current Habits to Include:**\n";
            foreach ($habits as $habit) {
                $streak = $habit->streak ?? 0;
                $target = $habit->target ?? 'N/A';
                $prompt .= "- {$habit->name} ({$habit->frequency}): Streak: {$streak} days, Target: {$target}\n";
            }
            $prompt .= "\n";
        } else {
            $prompt .= "**Current Habits:** None - user has no active habits\n\n";
        }

        // Add current tasks with more context
        if ($tasks->count() > 0) {
            $prompt .= "**Current Tasks to Schedule:**\n";
            foreach ($tasks->take(15) as $task) {
                $dueDate = $task->due_date ? "Due: {$task->due_date->format('M d')}" : "No due date";
                $prompt .= "- {$task->title} (Priority: {$task->priority}, {$dueDate})";
                if ($task->description) {
                    $prompt .= " - " . substr($task->description, 0, 80);
                }
                $prompt .= "\n";
            }
            $prompt .= "\n";
        } else {
            $prompt .= "**Current Tasks:** None - user has no pending tasks\n\n";
        }

        $prompt .= "**Instructions:**\n";
        $prompt .= "Create a detailed daily routine that includes:\n";
        $prompt .= "1. Morning routine (wake up, reflection, physical activity)\n";
        $prompt .= "2. Work/focus blocks with breaks\n";
        $prompt .= "3. Learning and personal development time\n";
        $prompt .= "4. Evening routine (wind down, journaling, preparation for next day)\n";
        $prompt .= "5. Time for current habits and tasks\n\n";
        $prompt .= "Format the response as a JSON object with the following structure:\n";
        $prompt .= "{\n";
        $prompt .= "  \"time_blocks\": [\n";
        $prompt .= "    {\n";
        $prompt .= "      \"start_time\": \"06:30\",\n";
        $prompt .= "      \"end_time\": \"07:00\",\n";
        $prompt .= "      \"activity\": \"Morning Reflection\",\n";
        $prompt .= "      \"description\": \"Brief description of the activity\",\n";
        $prompt .= "      \"category\": \"mindfulness\"\n";
        $prompt .= "    }\n";
        $prompt .= "  ]\n";
        $prompt .= "}\n\n";
        $prompt .= "Categories: mindfulness, physical, work, learning, social, rest, habits, tasks\n";
        $prompt .= "Ensure the routine is realistic and allows for flexibility.";

        return $prompt;
    }

    /**
     * Parse AI response into structured routine
     */
    protected function parseRoutineResponse(string $response, array $preferences = []): array
    {
        try {
            // Try to extract JSON from the response
            $jsonStart = strpos($response, '{');
            $jsonEnd = strrpos($response, '}') + 1;
            
            if ($jsonStart !== false && $jsonEnd !== false) {
                $jsonString = substr($response, $jsonStart, $jsonEnd - $jsonStart);
                $decoded = json_decode($jsonString, true);
                
                if (json_last_error() === JSON_ERROR_NONE && isset($decoded['time_blocks'])) {
                    return $decoded;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to parse AI routine response', [
                'error' => $e->getMessage(),
                'response' => $response,
            ]);
        }

        // Fallback to default routine
        return $this->getDefaultRoutine($preferences);
    }

    /**
     * Get default routine structure
     */
    protected function getDefaultRoutine(array $preferences): array
    {
        $wakeUpTime = $preferences['wake_up_time'] ?? '06:30';
        $sleepTime = $preferences['sleep_time'] ?? '22:00';

        return [
            'time_blocks' => [
                [
                    'start_time' => $wakeUpTime,
                    'end_time' => Carbon::parse($wakeUpTime)->addMinutes(30)->format('H:i'),
                    'activity' => 'Morning Reflection',
                    'description' => 'Start the day with mindfulness and intention setting',
                    'category' => 'mindfulness',
                ],
                [
                    'start_time' => Carbon::parse($wakeUpTime)->addMinutes(30)->format('H:i'),
                    'end_time' => Carbon::parse($wakeUpTime)->addHour()->format('H:i'),
                    'activity' => 'Physical Activity',
                    'description' => 'Exercise, yoga, or any form of physical movement',
                    'category' => 'physical',
                ],
                [
                    'start_time' => '09:00',
                    'end_time' => '12:00',
                    'activity' => 'Focused Work Block',
                    'description' => 'Deep work on important tasks and projects',
                    'category' => 'work',
                ],
                [
                    'start_time' => '12:00',
                    'end_time' => '13:00',
                    'activity' => 'Lunch Break',
                    'description' => 'Nourishing meal and mental break',
                    'category' => 'rest',
                ],
                [
                    'start_time' => '16:00',
                    'end_time' => '17:00',
                    'activity' => 'Learning Time',
                    'description' => 'Reading, courses, or skill development',
                    'category' => 'learning',
                ],
                [
                    'start_time' => '20:00',
                    'end_time' => '20:30',
                    'activity' => 'Evening Journaling',
                    'description' => 'Reflect on the day and plan for tomorrow',
                    'category' => 'mindfulness',
                ],
                [
                    'start_time' => '21:30',
                    'end_time' => $sleepTime,
                    'activity' => 'Wind Down',
                    'description' => 'Relaxing activities to prepare for sleep',
                    'category' => 'rest',
                ],
            ],
        ];
    }

    /**
     * Customize existing routine
     */
    public function customizeRoutine(array $routine, array $customizations): array
    {
        $customizedRoutine = $routine;

        foreach ($customizations as $customization) {
            $blockIndex = $customization['block_index'] ?? null;
            $action = $customization['action'] ?? null;

            if ($blockIndex !== null && isset($customizedRoutine['time_blocks'][$blockIndex])) {
                switch ($action) {
                    case 'modify':
                        if (isset($customization['start_time'])) {
                            $customizedRoutine['time_blocks'][$blockIndex]['start_time'] = $customization['start_time'];
                        }
                        if (isset($customization['end_time'])) {
                            $customizedRoutine['time_blocks'][$blockIndex]['end_time'] = $customization['end_time'];
                        }
                        if (isset($customization['activity'])) {
                            $customizedRoutine['time_blocks'][$blockIndex]['activity'] = $customization['activity'];
                        }
                        if (isset($customization['description'])) {
                            $customizedRoutine['time_blocks'][$blockIndex]['description'] = $customization['description'];
                        }
                        break;
                    case 'remove':
                        unset($customizedRoutine['time_blocks'][$blockIndex]);
                        $customizedRoutine['time_blocks'] = array_values($customizedRoutine['time_blocks']);
                        break;
                }
            } elseif ($action === 'add') {
                $customizedRoutine['time_blocks'][] = [
                    'start_time' => $customization['start_time'] ?? '09:00',
                    'end_time' => $customization['end_time'] ?? '10:00',
                    'activity' => $customization['activity'] ?? 'New Activity',
                    'description' => $customization['description'] ?? 'Custom activity',
                    'category' => $customization['category'] ?? 'custom',
                ];
            }
        }

        return $customizedRoutine;
    }

    /**
     * Get routine suggestions based on time of day
     */
    public function getTimeBasedSuggestions(string $timeOfDay): array
    {
        $suggestions = [
            'morning' => [
                'Morning meditation or reflection',
                'Light exercise or stretching',
                'Healthy breakfast preparation',
                'Goal setting for the day',
            ],
            'afternoon' => [
                'Focused work session',
                'Learning or skill development',
                'Physical activity or walk',
                'Social connection time',
            ],
            'evening' => [
                'Journaling or reflection',
                'Planning for tomorrow',
                'Relaxing activities',
                'Gratitude practice',
            ],
        ];

        return $suggestions[$timeOfDay] ?? [];
    }
}
