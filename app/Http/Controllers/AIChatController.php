<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Book;
use App\Models\Mentor;
use App\Models\Journal;
use App\Models\Task;
use App\Services\GeminiAIService;
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

    public function generateTaskSuggestions(Request $request)
    {
        $request->validate([
            'book_id' => 'required|integer|exists:books,id',
        ]);

        try {
            $geminiService = new GeminiAIService();
            $result = $geminiService->generateTaskSuggestions($request->input('book_id'));
            
            // Parse the suggestions and create tasks
            $lines = preg_split('/\r?\n/', $result['reply']);
            $tasks = [];
            $userId = Auth::id();
            $book = Book::where('user_id', $userId)->findOrFail($request->input('book_id'));
            
            foreach ($lines as $line) {
                $trim = trim($line);
                if ($trim === '') continue;
                if (preg_match('/^(?:[-*]\s+|\d+[\.)]\s+)/', $trim)) {
                    $title = preg_replace('/^(?:[-*]\s+|\d+[\.)]\s+)/', '', $trim);
                    $title = trim($title);
                    if (strlen($title) > 0) {
                        $tasks[] = Task::create([
                            'title' => mb_substr($title, 0, 120),
                            'description' => $title,
                            'is_completed' => false,
                            'user_id' => $userId,
                            'book_id' => $book->id,
                            'priority' => 'medium',
                            'due_date' => now()->addWeeks(2), // Set due date 2 weeks from now
                        ]);
                    }
                }
            }

            return redirect()->back()->with('success', 
                'Generated ' . count($tasks) . ' task suggestions successfully! Check your Tasks page to see them.'
            );

        } catch (\Exception $e) {
            Log::error('Gemini AI task suggestion error', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 
                'Failed to generate task suggestions: ' . $e->getMessage()
            );
        }
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

            // Use Gemini AI service
            $geminiService = new GeminiAIService();
            $result = $geminiService->generateBookResponse($prompt, $bookId, $conversation->id);

            // Save assistant reply
            Message::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => $result['reply'],
            ]);
            $conversation->update(['last_message_at' => now()]);

            return response()->json([
                'reply' => $result['reply'],
                'conversation_id' => $conversation->id,
            ]);

        } catch (\Exception $e) {
            Log::error('AI chat error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'AI service error: ' . $e->getMessage()], 500);
        }
    }
}
