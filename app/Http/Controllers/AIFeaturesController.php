<?php

namespace App\Http\Controllers;

use App\Services\SummaryGeneratorService;
use App\Services\AdviceCustomizerService;
use App\Services\RoutineBuilderService;
use App\Services\GeminiAIService;
use App\Models\Thinker;
use App\Models\Book;
use App\Models\Journal;
use App\Models\Task;
use App\Models\Habit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AIFeaturesController extends Controller
{
    protected $summaryGenerator;
    protected $adviceCustomizer;
    protected $routineBuilder;
    protected $geminiService;

    public function __construct(
        SummaryGeneratorService $summaryGenerator,
        AdviceCustomizerService $adviceCustomizer,
        RoutineBuilderService $routineBuilder,
        GeminiAIService $geminiService
    ) {
        $this->summaryGenerator = $summaryGenerator;
        $this->adviceCustomizer = $adviceCustomizer;
        $this->routineBuilder = $routineBuilder;
        $this->geminiService = $geminiService;
    }

    /**
     * Show AI features dashboard
     */
    public function index()
    {
        $user = auth()->user();
        
        // Get user's thinkers
        $userThinkers = $user->thinkers()->where('is_active', true)->get();
        
        // Get ThinkerType enum values
        $thinkerTypes = \App\Enums\ThinkerType::getPredefinedThinkers();
        $predefinedThinkers = array_map(function($type) {
            return [
                'id' => 'thinker_' . $type->value,
                'name' => $type->getDisplayName(),
                'type' => 'predefined',
            ];
        }, $thinkerTypes);
        
        // Get book authors
        $bookAuthors = \App\Models\Book::where('user_id', $user->id)
            ->whereNotNull('author')
            ->where('author', '!=', '')
            ->select('author')
            ->distinct()
            ->pluck('author')
            ->map(function($author) {
                return [
                    'id' => 'author_' . md5($author),
                    'name' => $author,
                    'type' => 'author',
                ];
            })
            ->toArray();
        
        // Combine all thinkers: user thinkers, predefined thinkers, and authors
        $allThinkers = $userThinkers->map(function($thinker) {
            return [
                'id' => $thinker->id,
                'name' => $thinker->getDisplayName(),
                'type' => 'user',
            ];
        })->toArray();
        
        $thinkers = array_merge($allThinkers, $predefinedThinkers, $bookAuthors);
        
        $books = $user->books()->latest()->limit(10)->get();

        return Inertia::render('AI/Features', [
            'thinkers' => $thinkers,
            'books' => $books,
        ]);
    }

    /**
     * Generate weekly summary
     */
    public function generateSummary(Request $request)
    {
        $request->validate([
            'startDate' => 'nullable|date',
        ]);

        $user = auth()->user();
        $startDate = $request->startDate ? Carbon::parse($request->startDate) : null;

        try {
            $summary = $this->summaryGenerator->generateWeeklySummary($user, $startDate);
            
            return response()->json([
                'success' => true,
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate summary', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate summary: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate personalized advice
     */
    public function generateAdvice(Request $request)
    {
        // Normalize empty strings to null
        $thinkerId = $request->thinker_id && $request->thinker_id !== '' ? $request->thinker_id : null;
        $bookId = $request->book_id && $request->book_id !== '' ? $request->book_id : null;
        $lifeArea = $request->life_area && $request->life_area !== '' ? $request->life_area : null;
        
        $request->validate([
            'thinker_id' => 'nullable|string', // Can be numeric ID, thinker_xxx, or author_xxx
            'book_id' => $bookId ? 'nullable|exists:books,id' : 'nullable',
            'goals' => 'nullable|array',
            'goals.*' => 'string|max:255',
            'life_area' => 'nullable|string|in:health,career,relationships,personal_growth,learning',
        ]);

        $user = auth()->user();
        
        try {
            // Handle different types of thinker IDs
            $thinker = null;
            $thinkerName = null;
            if ($thinkerId) {
                if (str_starts_with($thinkerId, 'thinker_')) {
                    // Predefined thinker
                    $thinkerTypeValue = str_replace('thinker_', '', $thinkerId);
                    $thinkerType = \App\Enums\ThinkerType::tryFrom($thinkerTypeValue);
                    if ($thinkerType) {
                        $thinkerName = $thinkerType->getDisplayName();
                    }
                } elseif (str_starts_with($thinkerId, 'author_')) {
                    // Author from book - extract author name from the hash
                    // We need to find the author by matching the hash
                    $authors = \App\Models\Book::where('user_id', $user->id)
                        ->whereNotNull('author')
                        ->where('author', '!=', '')
                        ->select('author')
                        ->distinct()
                        ->pluck('author')
                        ->toArray();
                    
                    foreach ($authors as $author) {
                        if ('author_' . md5($author) === $thinkerId) {
                            $thinkerName = $author;
                            break;
                        }
                    }
                } else {
                    // User's custom thinker
                    $thinker = Thinker::where('user_id', $user->id)->find($thinkerId);
                }
            }
            
            $book = null;
            if ($bookId) {
                $book = Book::where('user_id', $user->id)->find($bookId);
            }
            $goals = $request->goals ?? [];

            // If life area is specified, use it to generate goals
            if ($lifeArea) {
                $advice = $this->adviceCustomizer->generateLifeAreaAdvice($user, $lifeArea, $thinker, $thinkerName);
            } else {
                $advice = $this->adviceCustomizer->generateAdvice($user, $thinker, $thinkerName, $book, $goals);
            }

            return response()->json([
                'success' => true,
                'advice' => $advice,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate personalized advice', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate advice: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Save personalized advice to journal
     */
    public function saveAdviceToJournal(Request $request)
    {
        $request->validate([
            'advice' => 'required|string',
            'thinker' => 'nullable|string',
            'book' => 'nullable|string',
            'title' => 'nullable|string|max:255',
        ]);

        $user = auth()->user();
        
        $title = $request->title ?: 'Personalized Advice';
        if ($request->thinker) {
            $title .= ' - ' . $request->thinker;
        }
        if ($request->book) {
            $title .= ' (' . $request->book . ')';
        }
        
        // Truncate title if too long
        $title = Str::limit($title, 255);

        $journal = Journal::create([
            'user_id' => $user->id,
            'title' => $title,
            'content' => $request->advice,
            'tags' => ['ai-advice', 'personal-growth'],
            'entry_date' => today(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Advice saved to journal successfully!',
            'journal_id' => $journal->id,
        ]);
    }

    /**
     * Generate tasks from personalized advice
     */
    public function generateTasksFromAdvice(Request $request)
    {
        $request->validate([
            'advice' => 'required|string',
            'book_id' => 'nullable|exists:books,id',
        ]);

        $user = auth()->user();
        $bookId = $request->book_id;
        
        // Helper function to strip markdown formatting
        $stripMarkdown = function($text) {
            // Remove bold (**text**)
            $text = preg_replace('/\*\*(.*?)\*\*/', '$1', $text);
            // Remove italic (*text*)
            $text = preg_replace('/\*(.*?)\*/', '$1', $text);
            // Remove headers (# Header)
            $text = preg_replace('/^#{1,6}\s+/m', '', $text);
            // Remove links [text](url)
            $text = preg_replace('/\[([^\]]+)\]\([^\)]+\)/', '$1', $text);
            // Remove any remaining markdown symbols
            $text = preg_replace('/[#*_~`]/', '', $text);
            // Clean up extra whitespace
            $text = preg_replace('/\s+/', ' ', $text);
            return trim($text);
        };
        
        // Parse the advice text to extract actionable items
        $text = $request->advice;
        $lines = preg_split('/\r?\n/', $text);
        $tasks = [];
        
        foreach ($lines as $line) {
            $trim = trim($line);
            if ($trim === '') continue;
            
            // Look for numbered lists, bullet points, or action items
            if (preg_match('/^(?:[-*•]\s+|\d+[\.)]\s+|-\s*)/', $trim)) {
                $title = preg_replace('/^(?:[-*•]\s+|\d+[\.)]\s+|-\s*)/', '', $trim);
                $title = trim($title);
                
                // Strip markdown formatting
                $title = $stripMarkdown($title);
                
                // Skip if it's too short or looks like a header
                if (strlen($title) < 10 || preg_match('/^[A-Z\s]+$/', $title)) {
                    continue;
                }
                
                // Extract task title (first sentence or first 120 chars)
                $taskTitle = Str::limit($title, 120);
                $taskDescription = strlen($title) > 120 ? $title : null;
                
                // Determine priority based on keywords
                $priority = 'medium';
                $lowerTitle = strtolower($taskTitle);
                if (preg_match('/\b(urgent|important|critical|priority|asap|immediately)\b/', $lowerTitle)) {
                    $priority = 'high';
                } elseif (preg_match('/\b(optional|eventually|later|when possible)\b/', $lowerTitle)) {
                    $priority = 'low';
                }
                
                $tasks[] = Task::create([
                    'title' => $taskTitle,
                    'description' => $taskDescription,
                    'is_completed' => false,
                    'user_id' => $user->id,
                    'book_id' => $bookId,
                    'priority' => $priority,
                ]);
            }
        }
        
        // If no tasks were extracted from structured format, try to create one from the whole advice
        if (empty($tasks)) {
            // Extract first actionable sentence or use first 200 chars
            $firstSentence = preg_match('/^[^.!?]+[.!?]/', $text, $matches) 
                ? $matches[0] 
                : Str::limit($text, 200);
            
            // Strip markdown from the first sentence
            $firstSentence = $stripMarkdown($firstSentence);
            
            // Strip markdown from the full text for description
            $cleanText = $stripMarkdown($text);
            
            $tasks[] = Task::create([
                'title' => 'Follow personalized advice: ' . Str::limit($firstSentence, 100),
                'description' => $cleanText,
                'is_completed' => false,
                'user_id' => $user->id,
                'book_id' => $bookId,
                'priority' => 'medium',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => count($tasks) . ' task(s) created successfully!',
            'tasks' => array_map(fn($t) => ['id' => $t->id, 'title' => $t->title], $tasks),
            'count' => count($tasks),
        ]);
    }

    /**
     * Generate daily routine
     */
    public function generateRoutine(Request $request)
    {
        $request->validate([
            'wake_up_time' => 'nullable|date_format:H:i',
            'sleep_time' => 'nullable|date_format:H:i',
            'work_hours' => 'nullable|string',
            'focus_areas' => 'nullable|array',
            'focus_areas.*' => 'string|max:255',
        ]);

        $user = auth()->user();
        $preferences = $request->only(['wake_up_time', 'sleep_time', 'work_hours', 'focus_areas']);

        try {
            $routine = $this->routineBuilder->generateDailyRoutine($user, $preferences);
            
            return response()->json([
                'success' => true,
                'routine' => $routine,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate routine. Please try again later.',
            ], 500);
        }
    }

    /**
     * Customize routine
     */
    public function customizeRoutine(Request $request)
    {
        $request->validate([
            'routine' => 'required|array',
            'customizations' => 'required|array',
        ]);

        try {
            $customizedRoutine = $this->routineBuilder->customizeRoutine(
                $request->routine,
                $request->customizations
            );
            
            return response()->json([
                'success' => true,
                'routine' => $customizedRoutine,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to customize routine. Please try again later.',
            ], 500);
        }
    }

    /**
     * Get time-based suggestions
     */
    public function getTimeSuggestions(Request $request)
    {
        $request->validate([
            'time_of_day' => 'required|string|in:morning,afternoon,evening',
        ]);

        $suggestions = $this->routineBuilder->getTimeBasedSuggestions($request->time_of_day);

        return response()->json([
            'success' => true,
            'suggestions' => $suggestions,
        ]);
    }

    /**
     * Save routine as template
     */
    public function saveRoutineTemplate(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'routine' => 'required|array',
        ]);

        $user = auth()->user();
        
        // Save routine template to user's preferences or create a new model
        // This is a placeholder - you might want to create a RoutineTemplate model
        $template = [
            'name' => $request->name,
            'routine' => $request->routine,
            'user_id' => $user->id,
            'created_at' => now(),
        ];

        // For now, we'll just return success
        // In a real implementation, you'd save this to the database
        return response()->json([
            'success' => true,
            'message' => 'Routine template saved successfully',
            'template' => $template,
        ]);
    }

    /**
     * Generate habit suggestions based on user context
     */
    public function generateHabitSuggestions(Request $request)
    {
        $request->validate([
            'book_id' => 'nullable|exists:books,id',
            'thinker_id' => 'nullable|string',
            'life_area' => 'nullable|string',
            'goals' => 'nullable|array',
        ]);

        $user = auth()->user();
        
        try {
            // Get user context
            $habits = Habit::where('user_id', $user->id)->where('is_active', true)->get();
            $tasks = Task::where('user_id', $user->id)->where('is_completed', false)->take(10)->get();
            $books = Book::where('user_id', $user->id)->latest()->take(5)->get();
            
            // Get book context if provided
            $book = null;
            if ($request->book_id) {
                $book = Book::where('user_id', $user->id)->find($request->book_id);
            }
            
            // Get thinker context if provided
            $thinkerName = null;
            if ($request->thinker_id) {
                if (str_starts_with($request->thinker_id, 'thinker_')) {
                    $thinkerType = \App\Enums\ThinkerType::from(str_replace('thinker_', '', $request->thinker_id));
                    $thinkerName = $thinkerType->getDisplayName();
                } elseif (str_starts_with($request->thinker_id, 'author_')) {
                    // Extract author from book authors
                    $thinkerName = null; // Will be handled in prompt
                } else {
                    $thinker = Thinker::where('user_id', $user->id)->find($request->thinker_id);
                    if ($thinker) {
                        $thinkerName = $thinker->getDisplayName();
                    }
                }
            }
            
            // Build prompt for habit suggestions - prioritize book and goals
            $prompt = "";
            
            // PRIMARY FOCUS: Book context (if provided)
            if ($book) {
                $prompt .= "**PRIMARY FOCUS - BOOK (Generate habits DIRECTLY inspired by this book):**\n";
                $prompt .= "Title: {$book->title}\n";
                if ($book->author) {
                    $prompt .= "Author: {$book->author}\n";
                }
                if ($book->genre) {
                    $prompt .= "Genre: {$book->genre}\n";
                }
                $prompt .= "\n";
                $prompt .= "CRITICAL: All habit suggestions MUST be directly inspired by the concepts, principles, practices, or insights from this specific book. Base habits on what the book teaches, not generic advice.\n\n";
            }
            
            // PRIMARY FOCUS: User goals (if provided)
            if (!empty($request->goals)) {
                $prompt .= "**PRIMARY FOCUS - USER GOALS (Generate habits that directly support these goals):**\n";
                foreach ($request->goals as $goal) {
                    $prompt .= "- {$goal}\n";
                }
                $prompt .= "\n";
                $prompt .= "CRITICAL: All habit suggestions MUST directly support and help achieve these specific goals.\n\n";
            }
            
            // Life area focus
            if ($request->life_area) {
                $prompt .= "**Life Area Focus:** {$request->life_area}\n";
                $prompt .= "Focus habit suggestions in this area.\n\n";
            }
            
            // Thinker style (for context, not primary focus)
            if ($thinkerName) {
                $prompt .= "**Thinker Style (for context):** {$thinkerName}\n";
                $prompt .= "If applicable, align habits with this thinker's philosophy, but prioritize the book/goals above.\n\n";
            }
            
            // Current habits (for context - to avoid duplicates)
            if ($habits->count() > 0) {
                $prompt .= "**User's Current Habits (for reference - avoid suggesting duplicates):**\n";
                foreach ($habits->take(5) as $habit) {
                    $prompt .= "- {$habit->name} ({$habit->frequency})\n";
                }
                $prompt .= "\n";
            }
            
            // Current tasks (for context only)
            if ($tasks->count() > 0) {
                $prompt .= "**User's Current Tasks (for context only):**\n";
                foreach ($tasks->take(3) as $task) {
                    $prompt .= "- {$task->title}\n";
                }
                $prompt .= "\n";
            }
            
            $prompt .= "**CRITICAL INSTRUCTIONS:**\n";
            $prompt .= "Generate 5-7 habit suggestions that:\n";
            $prompt .= "1. **PRIMARY: Are DIRECTLY inspired by the book's content, principles, or practices (if book is provided)**\n";
            $prompt .= "2. **PRIMARY: Directly support the user's specific goals (if goals are provided)**\n";
            $prompt .= "3. Are specific, actionable, and clearly related to the book/goals\n";
            $prompt .= "4. Can be tracked daily or weekly\n";
            $prompt .= "5. Are realistic and achievable\n";
            $prompt .= "6. Include a suggested frequency (daily, weekly)\n";
            $prompt .= "7. Avoid duplicating existing habits listed above\n\n";
            $prompt .= "If a book is provided, the habits MUST be based on what the book teaches. For example:\n";
            $prompt .= "- If the book is about running, suggest running-related habits\n";
            $prompt .= "- If the book is about stoicism, suggest stoic practice habits\n";
            $prompt .= "- If the book is about productivity, suggest productivity habits from the book\n";
            $prompt .= "DO NOT suggest generic habits unrelated to the book's content.\n\n";
            $prompt .= "Format each habit as:\n";
            $prompt .= "Habit Name (Frequency): Description explaining how it relates to the book/goals\n\n";
            $prompt .= "Return ONLY the list of habits, one per line, with format:\n";
            $prompt .= "Habit Name (Frequency): Description\n\n";
            $prompt .= "Example for a running book:\n";
            $prompt .= "Daily Morning Run (Daily): Start each day with a 20-minute run to build endurance and mental resilience as taught in the book.\n";
            $prompt .= "Weekly Long Distance Run (Weekly): Complete one longer run each week to push your limits and build the mental toughness discussed in the book.\n";
            
            // Generate suggestions using AI
            $response = $this->geminiService->generateBookResponse($prompt, $book?->id, null, $user);
            $suggestionsText = $response['reply'];
            
            // Parse suggestions into structured format
            $suggestions = $this->parseHabitSuggestions($suggestionsText);
            
            return response()->json([
                'success' => true,
                'suggestions' => $suggestions,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate habit suggestions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate habit suggestions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Parse habit suggestions from AI response
     */
    protected function parseHabitSuggestions(string $text): array
    {
        $suggestions = [];
        $lines = preg_split('/\r?\n/', $text);
        
        $currentDescription = '';
        for ($i = 0; $i < count($lines); $i++) {
            $trimmed = trim($lines[$i]);
            if (empty($trimmed) || preg_match('/^[#*\-]/', $trimmed)) {
                // If we have a description accumulating, check if this is a continuation
                if (!empty($currentDescription) && !empty($trimmed) && !preg_match('/^[A-Z].*\(/', $trimmed)) {
                    $currentDescription .= ' ' . $trimmed;
                }
                continue;
            }
            
            // Look for patterns like "Habit Name (Frequency): Description"
            if (preg_match('/^(.+?)\s*\(([^)]+)\)\s*:?\s*(.+)$/i', $trimmed, $matches)) {
                $name = trim($matches[1]);
                $frequency = strtolower(trim($matches[2]));
                $description = trim($matches[3] ?? '');
                
                // Normalize frequency
                if (str_contains($frequency, 'daily')) {
                    $frequency = 'daily';
                } elseif (str_contains($frequency, 'weekly')) {
                    $frequency = 'weekly';
                } else {
                    $frequency = 'daily'; // Default
                }
                
                if (!empty($name)) {
                    $suggestions[] = [
                        'name' => $name,
                        'frequency' => $frequency,
                        'description' => $description,
                    ];
                    $currentDescription = '';
                }
            } elseif (preg_match('/^(.+?)\s*\(([^)]+)\)$/i', $trimmed, $matches)) {
                // Pattern: "Habit Name (Frequency)" - check next line for description
                $name = trim($matches[1]);
                $frequency = strtolower(trim($matches[2]));
                
                if (str_contains($frequency, 'daily')) {
                    $frequency = 'daily';
                } elseif (str_contains($frequency, 'weekly')) {
                    $frequency = 'weekly';
                } else {
                    $frequency = 'daily';
                }
                
                // Look ahead for description on next line
                $description = '';
                if ($i + 1 < count($lines)) {
                    $nextLine = trim($lines[$i + 1]);
                    // If next line doesn't look like a new habit, it's probably a description
                    if (!empty($nextLine) && !preg_match('/^[A-Z].*\(/', $nextLine) && !preg_match('/^[#*\-]/', $nextLine)) {
                        $description = $nextLine;
                        $i++; // Skip the next line since we've used it
                    }
                }
                
                if (!empty($name)) {
                    $suggestions[] = [
                        'name' => $name,
                        'frequency' => $frequency,
                        'description' => $description,
                    ];
                    $currentDescription = '';
                }
            } elseif (strlen($trimmed) > 10 && !preg_match('/^[A-Z\s]+$/', $trimmed)) {
                // Simple habit name without frequency
                $suggestions[] = [
                    'name' => $trimmed,
                    'frequency' => 'daily',
                    'description' => '',
                ];
                $currentDescription = '';
            }
        }
        
        // Limit to 7 suggestions
        return array_slice($suggestions, 0, 7);
    }

    /**
     * Create a habit from a suggestion
     */
    public function createHabitFromSuggestion(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'frequency' => 'required|in:daily,weekly,monthly',
            'target' => 'nullable|integer|min:1',
            'book_id' => 'nullable|exists:books,id',
            'description' => 'nullable|string|max:1000',
        ]);

        $user = auth()->user();
        
        $habit = Habit::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'description' => $request->description ?: null,
            'frequency' => $request->frequency,
            'target' => $request->target ?? 1,
            'book_id' => $request->book_id,
            'is_active' => true,
            'streak' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Habit created successfully!',
            'habit' => $habit,
        ]);
    }
}
