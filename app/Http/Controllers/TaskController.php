<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Book;
use App\Models\Habit;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Task::where('user_id', Auth::id())
                    ->with(['book:id,title,author', 'habit:id,name']);
        
        // Filter by completion status
        if ($status = $request->get('status')) {
            if ($status === 'completed') {
                $query->where('is_completed', true);
            } elseif ($status === 'pending') {
                $query->where('is_completed', false);
            }
        }
        
        // Filter by priority
        if ($priority = $request->get('priority')) {
            $query->where('priority', $priority);
        }
        
        // Filter by book
        if ($bookId = $request->get('book_id')) {
            $query->where('book_id', $bookId);
        }
        
        // Filter by due date
        if ($dueDateFilter = $request->get('due_date')) {
            switch ($dueDateFilter) {
                case 'today':
                    $query->whereDate('due_date', now());
                    break;
                case 'overdue':
                    $query->where('due_date', '<', now())
                          ->where('is_completed', false);
                    break;
                case 'this_week':
                    $query->whereBetween('due_date', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
            }
        }
        
        // Search functionality
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        $tasks = $query->orderBy('is_completed')
                      ->orderByRaw("FIELD(priority, 'high', 'medium', 'low')")
                      ->orderBy('due_date')
                      ->paginate(20)
                      ->withQueryString();
        
        // Get filter options
        $books = Book::where('user_id', Auth::id())
                    ->select('id', 'title', 'author')
                    ->orderBy('title')
                    ->get();
        
        return inertia('Tasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only(['status', 'priority', 'book_id', 'due_date', 'search']),
            'books' => $books,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $books = Book::where('user_id', Auth::id())
                    ->select('id', 'title', 'author')
                    ->orderBy('title')
                    ->get();
        
        $habits = Habit::where('user_id', Auth::id())
                      ->where('is_active', true)
                      ->select('id', 'name')
                      ->orderBy('name')
                      ->get();
        
        return inertia('Tasks/Create', [
            'books' => $books,
            'habits' => $habits,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTaskRequest $request)
    {
        $validated = $request->validated();
        $validated['user_id'] = Auth::id();
        $validated['is_completed'] = false;
        
        Task::create($validated);
        
        return redirect()->route('tasks.index')
            ->with('success', 'Task created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Task $task)
    {
        $this->authorize('view', $task);
        
        $task->load(['book:id,title,author', 'habit:id,name']);
        
        return inertia('Tasks/Show', [
            'task' => $task,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Task $task)
    {
        $this->authorize('update', $task);
        
        $books = Book::where('user_id', Auth::id())
                    ->select('id', 'title', 'author')
                    ->orderBy('title')
                    ->get();
        
        $habits = Habit::where('user_id', Auth::id())
                      ->where('is_active', true)
                      ->select('id', 'name')
                      ->orderBy('name')
                      ->get();
        
        return inertia('Tasks/Edit', [
            'task' => $task,
            'books' => $books,
            'habits' => $habits,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTaskRequest $request, Task $task)
    {
        $this->authorize('update', $task);
        
        $validated = $request->validated();
        $task->update($validated);
        
        return redirect()->route('tasks.index')
            ->with('success', 'Task updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);
        
        $task->delete();
        
        return redirect()->route('tasks.index')
            ->with('success', 'Task deleted successfully!');
    }

    /**
     * Toggle task completion status
     */
    public function toggle(Task $task)
    {
        $this->authorize('update', $task);
        
        $task->update([
            'is_completed' => !$task->is_completed,
        ]);
        
        $message = $task->is_completed ? 'Task marked as completed!' : 'Task marked as pending!';
        
        return response()->json([
            'message' => $message,
            'is_completed' => $task->is_completed,
        ]);
    }
}
