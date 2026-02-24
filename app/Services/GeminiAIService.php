<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Book;
use App\Models\Message;
use App\Models\Task;
use App\Models\Habit;

class GeminiAIService
{
    private string $apiKey;
    private string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    private string $model = 'gemini-2.5-flash';

    public function __construct()
    {
        $apiKey = config('services.gemini.api_key');
        if (!$apiKey) {
            throw new \Exception('GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env file.');
        }

        $this->apiKey = $apiKey;
    }

    /**
     * Generate a response about a book or author
     */
    public function generateBookResponse(string $message, ?int $bookId = null, ?int $conversationId = null, ?User $user = null, ?string $mentorName = null): array
    {
        $user = $user ?? Auth::user();
        if (!$user) {
            throw new \Exception('User not authenticated');
        }

        // Build system prompt with mentor context if mentor is selected
        $systemPrompt = '';
        if ($mentorName && trim($mentorName) !== '') {
            $systemPrompt = "You are {$mentorName}. You are having a conversation with someone who seeks your guidance and expertise. Respond naturally as {$mentorName} would, using their knowledge, perspective, and communication style. When asked about yourself or your work, respond as {$mentorName} would. ";
        }

        // Load conversation history for context if conversation exists
        $conversationHistory = '';
        if ($conversationId) {
            $messages = Message::where('conversation_id', $conversationId)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->reverse();

            if ($messages->count() > 0) {
                $history = '';
                foreach ($messages as $msg) {
                    $role = $msg->role === 'user' ? 'User' : ($mentorName ?: 'Assistant');
                    $history .= "\n{$role}: {$msg->content}";
                }
                $conversationHistory = "\n\nPrevious conversation:" . $history;
            }
        }

        // Build simple context based on book/author
        $bookContext = '';
        if ($bookId) {
            $book = Book::where('user_id', $user->id)->find($bookId);
            if ($book) {
                $bookContext = "\n\nContext: The user is discussing the book \"{$book->title}\"";
                if ($book->author) {
                    $bookContext .= " by {$book->author}";
                }
                $bookContext .= ".";
            }
        }

        // Combine system prompt, book context, conversation history, and user message
        $fullMessage = $systemPrompt . $message . $bookContext . $conversationHistory;

        $data = $this->callGeminiApi($fullMessage, [], ['user_id' => $user->id]);

        Log::info('Gemini API response', ['response' => $data]);

        $reply = $this->extractTextFromResponse($data, ['user_id' => $user->id]);

        return [
            'reply' => $reply,
            'conversation_id' => $conversationId,
        ];
    }

    /**
     * Generate task suggestions based on a book
     */
    public function generateTaskSuggestions(int $bookId): array
    {
        $user = Auth::user();
        if (!$user) {
            throw new \Exception('User not authenticated');
        }

        $book = Book::where('user_id', $user->id)->findOrFail($bookId);

        // Build a simple, safe prompt
        $prompt = "Based on the book \"{$book->title}\"";
        if ($book->author) {
            $prompt .= " by {$book->author}";
        }
        $prompt .= ", suggest 5-7 simple, everyday tasks a reader could do. Keep them safe, practical, and positive. Format as a numbered list.";

        $context = ['user_id' => $user->id, 'book_id' => $bookId];

        $data = $this->callGeminiApi($prompt, [], $context);

        Log::info('Gemini API task suggestions response', ['response' => $data]);

        try {
            $reply = $this->extractTextFromResponse($data, $context);
        } catch (\Exception $e) {
            Log::error('Gemini API empty reply - could not extract text from any known path', [
                'response' => $data,
                'user_id' => $user->id,
                'book_id' => $bookId,
            ]);

            return [
                'reply' => "No tasks could be generated for this book. Please try rephrasing your request or try again later.",
                'book_id' => $bookId,
            ];
        }

        return [
            'reply' => $reply,
            'book_id' => $bookId,
        ];
    }

    /**
     * Generate book suggestions based on user's tasks and habits
     */
    public function generateBookSuggestions(User $user): array
    {
        // Fetch user's active tasks and habits
        $tasks = Task::where('user_id', $user->id)
            ->where('is_completed', false)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->pluck('title')
            ->toArray();

        $habits = Habit::where('user_id', $user->id)
            ->where('is_active', true)
            ->pluck('name')
            ->toArray();

        // Construct the prompt
        $prompt = "Based on the following user context, suggest 5 books that would be helpful for them. \n\n";

        if (!empty($tasks)) {
            $prompt .= "Current Tasks:\n- " . implode("\n- ", $tasks) . "\n\n";
        }

        if (!empty($habits)) {
            $prompt .= "Current Habits:\n- " . implode("\n- ", $habits) . "\n\n";
        }

        $prompt .= "Please provide the suggestions in JSON format with the following structure for each book:\n";
        $prompt .= "[{ \"title\": \"Book Title\", \"author\": \"Author Name\", \"reason\": \"Why this book is recommended based on their tasks/habits\" }]";

        $generationConfig = [
            'temperature' => 0.7,
            'maxOutputTokens' => 2048,
            'responseMimeType' => 'application/json',
        ];

        $response = Http::timeout(30)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post("{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}", [
                'contents' => [['parts' => [['text' => $prompt]]]],
                'generationConfig' => $generationConfig,
            ]);

        if (!$response->successful()) {
            Log::error('Gemini API error for book suggestions', [
                'status' => $response->status(),
                'response' => $response->body(),
                'user_id' => $user->id,
            ]);
            throw new \Exception('AI service error: ' . $response->status());
        }

        $data = $response->json();

        // Extract text
        $reply = '';
        if (!empty($data['candidates'][0]['content']['parts'][0]['text'])) {
            $reply = $data['candidates'][0]['content']['parts'][0]['text'];
        }

        // Parse JSON response
        try {
            // Clean up potential markdown code blocks if present
            $jsonStr = preg_replace('/^```json\s*|\s*```$/', '', trim($reply));
            $suggestions = json_decode($jsonStr, true);

            if (!is_array($suggestions)) {
                throw new \Exception('Invalid JSON format');
            }

            return $suggestions;
        } catch (\Exception $e) {
            Log::error('Failed to parse book suggestions JSON', ['reply' => $reply, 'error' => $e->getMessage()]);
            // Fallback or empty array
            return [];
        }
    }

    /**
     * Make a request to the Gemini API and return the decoded response body.
     *
     * @param  array<string, mixed>  $generationConfig  Extra generation config overrides.
     * @param  array<string, mixed>  $context  Log context (e.g. user_id, book_id).
     * @return array<string, mixed>
     */
    private function callGeminiApi(string $prompt, array $generationConfig = [], array $context = []): array
    {
        $url = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::timeout(30)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($url, [
                'contents' => [['parts' => [['text' => $prompt]]]],
                'generationConfig' => array_merge([
                    'temperature' => 0.7,
                    'maxOutputTokens' => 2048,
                ], $generationConfig),
                'safetySettings' => [
                    ['category' => 'HARM_CATEGORY_HARASSMENT',        'threshold' => 'BLOCK_NONE'],
                    ['category' => 'HARM_CATEGORY_HATE_SPEECH',       'threshold' => 'BLOCK_NONE'],
                    ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_NONE'],
                    ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_NONE'],
                ],
            ]);

        if (!$response->successful()) {
            Log::error('Gemini API error', array_merge($context, [
                'status' => $response->status(),
                'response' => $response->body(),
            ]));

            throw new \Exception('AI service error: ' . $response->status() . ' - ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Extract the text reply from a Gemini API response array.
     *
     * Handles finish-reason logging and throws on unrecoverable errors.
     *
     * @param  array<string, mixed>  $data     Decoded Gemini API response.
     * @param  array<string, mixed>  $context  Log context (e.g. user_id, book_id).
     * @return string
     */
    private function extractTextFromResponse(array $data, array $context = []): string
    {
        if (empty($data['candidates'])) {
            Log::error('Gemini API empty candidates', array_merge($context, ['response' => $data]));
            throw new \Exception('AI service returned no response. Please try again.');
        }

        $candidate = $data['candidates'][0] ?? null;
        if (!$candidate) {
            Log::error('Gemini API no candidate in response', array_merge($context, ['response' => $data]));
            throw new \Exception('AI service returned no response. Please try again.');
        }

        Log::debug('Gemini API candidate structure', array_merge($context, ['candidate' => $candidate]));

        $finishReason = $candidate['finishReason'] ?? null;
        if ($finishReason && $finishReason !== 'STOP') {
            if ($finishReason === 'SAFETY') {
                Log::warning('Gemini API response blocked by safety filters', array_merge($context, ['finish_reason' => $finishReason]));
                throw new \Exception('AI response was blocked by safety filters. Please try rephrasing your request.');
            } elseif ($finishReason === 'MAX_TOKENS') {
                Log::warning('Gemini API response hit token limit', array_merge($context, ['finish_reason' => $finishReason]));
                // Still try to use the partial response if available
            } else {
                Log::warning('Gemini API response ended with non-STOP reason', array_merge($context, ['finish_reason' => $finishReason]));
                // For other reasons, try to use the response anyway
            }
        }

        // Try to extract text from response - check multiple possible locations
        $reply = '';

        // Path 1: Standard structure - content.parts[0].text
        if (!empty($candidate['content']['parts'][0]['text'])) {
            $reply = $candidate['content']['parts'][0]['text'];
        }
        // Path 2: Alternative structure - content.parts[0] as string
        elseif (!empty($candidate['content']['parts'][0]) && is_string($candidate['content']['parts'][0])) {
            $reply = $candidate['content']['parts'][0];
        }
        // Path 3: Direct output field
        elseif (!empty($candidate['output'])) {
            $reply = $candidate['output'];
        }
        // Path 4: content.parts[0] as object with text property
        elseif (!empty($candidate['content']['parts'][0])) {
            $part = $candidate['content']['parts'][0];
            if (is_array($part) && isset($part['text'])) {
                $reply = $part['text'];
            }
        }
        // Path 5: content.text (direct text field)
        elseif (!empty($candidate['content']['text'])) {
            $reply = $candidate['content']['text'];
        }
        // Path 6: text field at root level
        elseif (!empty($candidate['text'])) {
            $reply = $candidate['text'];
        }

        if (empty($reply)) {
            if ($finishReason === 'MAX_TOKENS') {
                Log::error('Gemini API empty reply due to token limit', array_merge($context, [
                    'candidate' => $candidate,
                    'response' => $data,
                ]));
                throw new \Exception('AI response exceeded token limit. The prompt may be too long. Please try simplifying your request.');
            }

            Log::error('Gemini API empty reply - could not extract text from any known path', array_merge($context, [
                'candidate' => $candidate,
                'response' => $data,
            ]));
            throw new \Exception('AI service returned empty response. Please try again.');
        }

        return $reply;
    }
}
