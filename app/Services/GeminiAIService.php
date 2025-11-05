<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Book;
use App\Models\Message;

class GeminiAIService
{
    private string $apiKey;
    private string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    private string $model = 'gemini-2.5-flash'; // Fast model that works with v1beta

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

        // Make API request
        $url = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";
        
        $response = Http::timeout(30)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $fullMessage]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 2048,
                ],
                'safetySettings' => [
                    [
                        'category' => 'HARM_CATEGORY_HARASSMENT',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_HATE_SPEECH',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        'threshold' => 'BLOCK_NONE'
                    ]
                ]
            ]);

            if (!$response->successful()) {
            Log::error('Gemini API error', [
                'status' => $response->status(),
                'response' => $response->body(),
                'user_id' => $user->id,
            ]);
            
            throw new \Exception('AI service error: ' . $response->status() . ' - ' . $response->body());
            }

            $data = $response->json();
        
        // Log full response for debugging
        Log::info('Gemini API response', ['response' => $data]);
        
        // Check if response has candidates
        if (!isset($data['candidates']) || empty($data['candidates'])) {
            Log::error('Gemini API empty candidates', [
                'response' => $data,
                'user_id' => $user->id,
            ]);
            throw new \Exception('AI service returned no response. Please try again.');
        }
        
        $candidate = $data['candidates'][0] ?? null;
        if (!$candidate) {
            Log::error('Gemini API no candidate in response', [
                'response' => $data,
                'user_id' => $user->id,
            ]);
            throw new \Exception('AI service returned no response. Please try again.');
        }
        
        // Log raw candidate structure for debugging
        Log::debug('Gemini API candidate structure', [
            'candidate' => $candidate,
            'user_id' => $user->id,
        ]);
        
            // Check finish reason - handle different cases
            $finishReason = $candidate['finishReason'] ?? null;
            if ($finishReason && $finishReason !== 'STOP') {
                if ($finishReason === 'SAFETY') {
                    Log::warning('Gemini API response blocked by safety filters', [
                        'finish_reason' => $finishReason,
                        'user_id' => $user->id,
                    ]);
                    throw new \Exception('AI response was blocked by safety filters. Please try rephrasing your request.');
                } elseif ($finishReason === 'MAX_TOKENS') {
                    Log::warning('Gemini API response hit token limit', [
                        'finish_reason' => $finishReason,
                        'user_id' => $user->id,
                    ]);
                    // Still try to use the partial response if available
                    // Don't throw yet, check if there's content first
                } else {
                    Log::warning('Gemini API response ended with non-STOP reason', [
                        'finish_reason' => $finishReason,
                        'user_id' => $user->id,
                    ]);
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

            // If still empty, check if it's due to MAX_TOKENS and provide a helpful message
            if (empty($reply)) {
                if ($finishReason === 'MAX_TOKENS') {
                    Log::error('Gemini API empty reply due to token limit', [
                        'candidate' => $candidate,
                        'response' => $data,
                        'user_id' => $user->id,
                    ]);
                    throw new \Exception('AI response exceeded token limit. The prompt may be too long. Please try simplifying your request.');
                } else {
                    Log::error('Gemini API empty reply - could not extract text from any known path', [
                        'candidate' => $candidate,
                        'response' => $data,
                        'user_id' => $user->id,
                    ]);
                    throw new \Exception('AI service returned empty response. Please try again.');
                }
            }

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

        // Make API request
        $url = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";
        
        $response = Http::timeout(30)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 2048,
                ],
                'safetySettings' => [
                    [
                        'category' => 'HARM_CATEGORY_HARASSMENT',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_HATE_SPEECH',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        'threshold' => 'BLOCK_NONE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        'threshold' => 'BLOCK_NONE'
                    ]
                ]
            ]);

            if (!$response->successful()) {
            Log::error('Gemini API error', [
                'status' => $response->status(),
                'response' => $response->body(),
                'user_id' => $user->id,
                'book_id' => $bookId,
            ]);
            
            throw new \Exception('AI service error: ' . $response->status() . ' - ' . $response->body());
            }

            $data = $response->json();
        
        // Log full response for debugging
        Log::info('Gemini API task suggestions response', ['response' => $data]);
        
        // Check if response has candidates
        if (!isset($data['candidates']) || empty($data['candidates'])) {
            Log::error('Gemini API empty candidates', [
                'response' => $data,
                'user_id' => $user->id,
                'book_id' => $bookId,
            ]);
            throw new \Exception('AI service returned no response. Please try again.');
        }
        
        $candidate = $data['candidates'][0] ?? null;
        if (!$candidate) {
            Log::error('Gemini API no candidate in response', [
                'response' => $data,
                'user_id' => $user->id,
                'book_id' => $bookId,
            ]);
            throw new \Exception('AI service returned no response. Please try again.');
        }
        
        // Log raw candidate structure for debugging
        Log::debug('Gemini API candidate structure', [
            'candidate' => $candidate,
            'user_id' => $user->id,
            'book_id' => $bookId,
        ]);
        
        // Check finish reason - handle different cases
        $finishReason = $candidate['finishReason'] ?? null;
        if ($finishReason && $finishReason !== 'STOP') {
            if ($finishReason === 'SAFETY') {
                Log::warning('Gemini API task suggestions blocked by safety filters', [
                    'finish_reason' => $finishReason,
                    'user_id' => $user->id,
                    'book_id' => $bookId,
                ]);
                throw new \Exception('AI response was blocked by safety filters. Please try rephrasing your request.');
            } elseif ($finishReason === 'MAX_TOKENS') {
                Log::warning('Gemini API task suggestions hit token limit', [
                    'finish_reason' => $finishReason,
                    'user_id' => $user->id,
                    'book_id' => $bookId,
                ]);
                // Still try to use the partial response
                // Don't throw, just log and continue
            } else {
                Log::warning('Gemini API task suggestions ended with non-STOP reason', [
                    'finish_reason' => $finishReason,
                    'user_id' => $user->id,
                    'book_id' => $bookId,
                ]);
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

        // If still empty, log and return a graceful fallback
        if (empty($reply)) {
            Log::error('Gemini API empty reply - could not extract text from any known path', [
                'candidate' => $candidate,
                'response' => $data,
                'user_id' => $user->id,
                'book_id' => $bookId,
            ]);
            
            // Return a helpful message instead of throwing
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

}
