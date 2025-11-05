<?php

namespace App\Http\Controllers;

use App\Models\Habit;
use App\Models\Book;
use App\Models\Task;
use App\Http\Requests\StoreHabitRequest;
use App\Http\Requests\UpdateHabitRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class HabitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Habit::where('user_id', Auth::id())
                     ->with(['book:id,title,author']);
        
        // Filter by status
        if ($status = $request->get('status')) {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }
        
        // Filter by book
        if ($bookId = $request->get('book_id')) {
            $query->where('book_id', $bookId);
        }
        
        $habits = $query->orderByDesc('created_at')
                       ->paginate(15)
                       ->withQueryString();
        
        // Add streak status to each habit
        $habits->getCollection()->transform(function ($habit) {
            $habit->streak_status = $habit->getStreakStatus();
            $habit->completed_today = $habit->isCompletedToday();
            return $habit;
        });
        
        // Get books for filter dropdown
        $books = Book::where('user_id', Auth::id())
                    ->select('id', 'title', 'author')
                    ->orderBy('title')
                    ->get();
        
        return inertia('Habits/Index', [
            'habits' => $habits,
            'filters' => $request->only(['status', 'book_id']),
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
        
        $tasks = Task::where('user_id', Auth::id())
                    ->select('id', 'title')
                    ->orderBy('title')
                    ->get();
        
        return inertia('Habits/Create', [
            'books' => $books,
            'tasks' => $tasks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreHabitRequest $request)
    {
        $validated = $request->validated();
        $validated['user_id'] = Auth::id();
        
        // Convert empty strings to null for optional fields
        if (isset($validated['book_id']) && $validated['book_id'] === '') {
            $validated['book_id'] = null;
        }
        if (isset($validated['task_id']) && $validated['task_id'] === '') {
            $validated['task_id'] = null;
        }
        if (isset($validated['target']) && $validated['target'] === '') {
            $validated['target'] = null;
        }
        if (isset($validated['description']) && $validated['description'] === '') {
            $validated['description'] = null;
        }
        
        // Set defaults
        $validated['streak'] = 0;
        if (!isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }
        
        Habit::create($validated);
        
        return redirect()->route('habits.index')
            ->with('success', 'Habit created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Habit $habit)
    {
        $this->authorize('view', $habit);
        
        $habit->load(['book:id,title,author']);
        $habit->streak_status = $habit->getStreakStatus();
        $habit->completed_today = $habit->isCompletedToday();
        
        // Get last 30 days of completion data for calendar view
        $completionData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $completed = $habit->last_completed && $habit->last_completed->gte($date->startOfDay()) && $habit->last_completed->lte($date->endOfDay());
            $completionData[] = [
                'date' => $date->toDateString(),
                'completed' => $completed,
            ];
        }
        
        return inertia('Habits/Show', [
            'habit' => $habit,
            'completionData' => $completionData,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Habit $habit)
    {
        $this->authorize('update', $habit);
        
        $books = Book::where('user_id', Auth::id())
                    ->select('id', 'title', 'author')
                    ->orderBy('title')
                    ->get();
        
        return inertia('Habits/Edit', [
            'habit' => $habit,
            'books' => $books,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateHabitRequest $request, Habit $habit)
    {
        $this->authorize('update', $habit);
        
        $validated = $request->validated();
        $habit->update($validated);
        
        return redirect()->route('habits.index')
            ->with('success', 'Habit updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Habit $habit)
    {
        $this->authorize('delete', $habit);
        
        $habit->delete();
        
        return redirect()->route('habits.index')
            ->with('success', 'Habit deleted successfully!');
    }

    /**
     * Mark habit as completed for today
     */
    public function checkIn(Habit $habit)
    {
        // If already completed today, inform the user via flash message
        if ($habit->isCompletedToday()) {
            return redirect()->back()->with('info', 'Habit already completed today!');
        }

        // Mark as completed and redirect back with success flash
        $habit->markCompleted();

        return redirect()->back()->with('success', 'Habit checked in successfully! Current streak: ' . $habit->streak);
    }
}
