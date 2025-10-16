<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Book;
use App\Models\Mentor;
use App\Models\Journal;
use App\Models\Task;
use GuzzleHttp\Exception\TransferException;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ServerException;
use Illuminate\Support\Str;

class AIChatController extends Controller
{
    public function conversations(Request $request)
    {
        $userId = Auth::id();
        if (!$userId) return response()->json(['error' => 'Unauthorized'], 401);
        $items = Conversation::where('user_id', $userId)
            ->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->select('id','title','last_message_at','updated_at')
            ->get();
        return response()->json(['conversations' => $items]);
    }

    public function saveJournal(Request $request)
    {
        $request->validate([
            'conversation_id' => 'required|integer|exists:conversations,id',
            'content' => 'required|string',
            'title' => 'nullable|string',
        ]);
        $userId = Auth::id();
        $conv = Conversation::where('user_id', $userId)->findOrFail($request->integer('conversation_id'));
        $inputTitle = trim((string) $request->input('title', ''));
        $contentStr = (string) $request->input('content');
        $title = $inputTitle !== '' ? $inputTitle : Str::limit(trim(strip_tags($contentStr)), 80, '');
        $journal = Journal::create([
            'user_id' => $userId,
            'title' => (string) $title,
            'content' => $contentStr,
            'tags' => ['mentor-chat'],
            'entry_date' => today(),
        ]);
        return response()->json(['journal_id' => $journal->id]);
    }

    public function tasksFromReply(Request $request)
    {
        $request->validate([
            'conversation_id' => 'required|integer|exists:conversations,id',
            'content' => 'required|string',
            'book_id' => 'nullable|integer|exists:books,id',
        ]);
        $userId = Auth::id();
        $conv = Conversation::where('user_id', $userId)->findOrFail($request->integer('conversation_id'));
        $bookId = $request->input('book_id');

        $text = (string) $request->input('content');
        $lines = preg_split('/\r?\n/', $text);
        $tasks = [];
        foreach ($lines as $line) {
            $trim = trim($line);
            if ($trim === '') continue;
            if (preg_match('/^(?:[-*]\s+|\d+[\.)]\s+)/', $trim)) {
                $title = preg_replace('/^(?:[-*]\s+|\d+[\.)]\s+)/', '', $trim);
                $tasks[] = Task::create([
                    'title' => mb_substr($title, 0, 120),
                    'description' => $title,
                    'is_completed' => false,
                    'user_id' => $userId,
                    'book_id' => $bookId ?: $conv->book_id,
                    'priority' => 'medium',
                ]);
            }
        }
        return response()->json(['created' => array_map(fn($t) => $t->id, $tasks)]);
    }

    public function conversation(Request $request, int $id)
    {
        $userId = Auth::id();
        if (!$userId) return response()->json(['error' => 'Unauthorized'], 401);
        $conv = Conversation::where('user_id', $userId)->findOrFail($id);
        $messages = $conv->messages()->orderBy('created_at')->get(['role','content','created_at']);
        return response()->json([
            'conversation' => ['id' => $conv->id, 'title' => $conv->title, 'last_message_at' => $conv->last_message_at],
            'messages' => $messages,
        ]);
    }

    /**
     * Update conversation title
     */
    public function updateConversation(Request $request, int $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
        ]);
        
        $userId = Auth::id();
        if (!$userId) return response()->json(['error' => 'Unauthorized'], 401);
        
        $conv = Conversation::where('user_id', $userId)->findOrFail($id);
        $conv->update([
            'title' => $request->input('title'),
        ]);
        
        return response()->json([
            'message' => 'Conversation updated successfully',
            'conversation' => $conv,
        ]);
    }

    /**
     * Delete conversation and all its messages
     */
    public function deleteConversation(int $id)
    {
        $userId = Auth::id();
        if (!$userId) return response()->json(['error' => 'Unauthorized'], 401);
        
        $conv = Conversation::where('user_id', $userId)->findOrFail($id);
        
        // Delete all messages first
        $conv->messages()->delete();
        
        // Delete the conversation
        $conv->delete();
        
        return response()->json([
            'message' => 'Conversation deleted successfully',
        ]);
    }

    public function chat(Request $request)
    {
        Log::info('mentor-chat endpoint hit');
        $request->validate([
            'message' => 'required|string',
            'conversation_id' => 'nullable|integer|exists:conversations,id',
            'book_id' => 'nullable|integer|exists:books,id',
            'mentor_id' => 'nullable|integer|exists:mentors,id',
            'book' => 'nullable|string', // legacy string support
            'mentor' => 'nullable|string', // legacy string support
        ]);

        $prompt = (string) $request->input('message');
        $bookName = (string) $request->input('book', '');
        $mentorName = (string) $request->input('mentor', '');
        $bookId = $request->input('book_id');
        $mentorId = $request->input('mentor_id');
        $conversationId = $request->input('conversation_id');

        $apiKey = env('OPENAI_API_KEY')
            ?: config('services.openai.key')
            ?: config('services.slack.openai.aiapi_key');
        if (!$apiKey) {
            return response()->json(['error' => 'Missing OPENAI_API_KEY'], 500);
        }

        $model = config('services.openai.model') ?: 'gpt-3.5-turbo';

        // Use first author if multiple delimited by commas/ampersands
        if ($mentorName) {
            $first = preg_split('/\s*[,&]\s+|\s+and\s+/i', $mentorName);
            $mentorName = trim($first[0] ?? $mentorName);
        }

        // Try to fetch persona/tone from Mentor model when mentor_id provided (optional fields)
        $personaPrompt = '';
        $tone = '';
        if (!empty($mentorId)) {
            $mentorRow = Mentor::find($mentorId);
            if ($mentorRow) {
                $personaPrompt = (string) ($mentorRow->persona_prompt ?? '');
                $tone = (string) ($mentorRow->tone ?? '');
            }
        }

        // Build book context snippet
        $bookContext = '';
        if ($bookName) {
            $bookContext = "Book Context: {$bookName}";
            // If we have a book id, we likely have author field via $book
            if (isset($book) && !empty($book->author)) {
                $bookContext .= " — Author: {$book->author}";
            }
            $bookContext .= "\n";
        }

        // Default persona if none provided
        if (!$personaPrompt && $mentorName) {
            $personaPrompt = "Emulate the style of {$mentorName}. Prioritize clarity, practicality, and evidence-informed reasoning.";
        }

        // Tone line
        $toneLine = $tone ? ("Tone: " . $tone . "\n") : '';

        $system = trim(implode("\n", array_filter([
            $mentorName ? "You are acting as {$mentorName}." : "You are an AI mentor.",
            $personaPrompt ?: null,
            $bookContext ?: null,
            $toneLine ?: null,
            "Rules:",
            "- Ground advice in key principles from the selected book when relevant.",
            "- Give clear, actionable steps or checklists.",
            "- Be concise; avoid long paragraphs.",
            "- Encourage reflection and small experiments.",
            "- Do not provide therapy or medical advice; redirect to professionals if needed.",
            "- Structure: brief summary, then numbered steps, then a short nudge.",
        ])));

        try {
            // Resolve book/mentor display names if IDs are provided
            if ($bookId) {
                $book = Book::where('user_id', Auth::id())->find($bookId);
                if ($book) { $bookName = $book->title; }
            }
            if ($mentorId) {
                $mentor = Mentor::find($mentorId);
                if ($mentor) { $mentorName = $mentor->name ?? $mentorName; }
            }

            // Find or create conversation
            $conversation = null;
            if ($conversationId) {
                $conversation = Conversation::where('user_id', Auth::id())->findOrFail($conversationId);
            } else {
                $title = $mentorName ?: ($bookName ?: mb_substr($prompt, 0, 50));
                $conversation = Conversation::create([
                    'user_id' => Auth::id(),
                    'mentor_id' => $mentorId,
                    'book_id' => $bookId,
                    'title' => $title,
                    'last_message_at' => now(),
                ]);
            }

            // Save user message
            Message::create([
                'conversation_id' => $conversation->id,
                'role' => 'user',
                'content' => $prompt,
            ]);

            $timeout = (float) (env('OPENAI_TIMEOUT', 30));
            $connectTimeout = (float) (env('OPENAI_CONNECT_TIMEOUT', 10));
            $proxy = env('OPENAI_PROXY'); // e.g. http://user:pass@host:port

            $client = new Client([
                'base_uri' => 'https://api.openai.com',
                'timeout' => $timeout,
                'connect_timeout' => $connectTimeout,
                'proxy' => $proxy ?: null,
            ]);

            $payload = [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => (string)$prompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 500,
            ];

            $maxAttempts = 3;
            $attempt = 0;
            $response = null;
            while ($attempt < $maxAttempts) {
                $attempt++;
                try {
                    $response = $client->post('/v1/chat/completions', [
                        'headers' => [
                            'Authorization' => 'Bearer ' . $apiKey,
                            'Content-Type' => 'application/json',
                        ],
                        'json' => $payload,
                    ]);
                    break; // success
                } catch (ClientException $cex) {
                    $code = $cex->getResponse() ? $cex->getResponse()->getStatusCode() : 400;
                    $body = $cex->getResponse() ? (string) $cex->getResponse()->getBody() : '';
                    Log::error('OpenAI client error', ['attempt' => $attempt, 'code' => $code, 'body' => $body]);
                    return response()->json(['error' => "AI client error ($code): " . substr($body, 0, 300)], $code);
                } catch (ServerException $sex) {
                    $code = $sex->getResponse() ? $sex->getResponse()->getStatusCode() : 500;
                    $body = $sex->getResponse() ? (string) $sex->getResponse()->getBody() : '';
                    Log::warning('OpenAI server error', ['attempt' => $attempt, 'code' => $code, 'body' => $body]);
                    // retryable
                } catch (ConnectException $ce) {
                    Log::warning('OpenAI connect exception', ['attempt' => $attempt, 'error' => $ce->getMessage()]);
                } catch (TransferException $te) {
                    // Retry 5xx and timeouts
                    $code = method_exists($te, 'getCode') ? (int) $te->getCode() : 0;
                    Log::warning('OpenAI transfer exception', ['attempt' => $attempt, 'code' => $code, 'error' => $te->getMessage()]);
                    if ($code && $code < 500) {
                        throw $te; // do not retry 4xx
                    }
                }
                // Exponential backoff: 200ms, 400ms
                usleep(200000 * $attempt);
            }
            if (!$response) {
                return response()->json(['error' => 'AI service is temporarily unreachable. Please try again.'], 503);
            }

            $data = json_decode((string) $response->getBody(), true);
            $text = $data['choices'][0]['message']['content'] ?? '';
            // Save assistant reply
            Message::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => $text,
            ]);
            $conversation->update(['last_message_at' => now()]);

            return response()->json([
                'reply' => $text,
                'conversation_id' => $conversation->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('AI chat error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'AI service error: ' . $e->getMessage()], 500);
        }
    }
}
