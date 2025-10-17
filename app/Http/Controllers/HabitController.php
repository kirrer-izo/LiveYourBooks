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
        return inertia('Habits/Create', [
            'books' => Book::all(['id', 'title']),
            'tasks' => Task::all(['id', 'title'])
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreHabitRequest $request)
    {
        $validated = $request->validated();
        $validated['user_id'] = Auth::id();
        $validated['streak'] = 0;
        $validated['is_active'] = true;
        
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
        
        
        if ($habit->isCompletedToday()) {
            return response()->json([
                'message' => 'Habit already completed today!',
                'completed_today' => true,
                'streak' => $habit->streak,
            ]);
        }
        
        $habit->markCompleted();
        
        return response()->json([
            'message' => 'Habit checked in successfully!',
            'completed_today' => true,
            'streak' => $habit->streak,
            'streak_status' => $habit->getStreakStatus(),
        ]);
    }
}
