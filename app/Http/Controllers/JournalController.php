<?php

namespace App\Http\Controllers;

use App\Models\Journal;
use App\Http\Requests\StoreJournalRequest;
use App\Http\Requests\UpdateJournalRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class JournalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Journal::where('user_id', Auth::id());
        
        // Search functionality
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }
        
        // Tag filtering
        if ($tag = $request->get('tag')) {
            $query->whereJsonContains('tags', $tag);
        }
        
        // Date filtering
        if ($date = $request->get('date')) {
            $query->whereDate('entry_date', $date);
        }
        
        $journals = $query->orderByDesc('entry_date')
                         ->orderByDesc('created_at')
                         ->paginate(15)
                         ->withQueryString();
        
        // Get all unique tags for filter dropdown
        $allTags = Journal::where('user_id', Auth::id())
                         ->whereNotNull('tags')
                         ->pluck('tags')
                         ->flatten()
                         ->unique()
                         ->sort()
                         ->values();
        
        return inertia('Journals/Index', [
            'journals' => $journals,
            'filters' => $request->only(['search', 'tag', 'date']),
            'availableTags' => $allTags,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('Journals/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreJournalRequest $request)
    {
        $validated = $request->validated();
        $validated['user_id'] = Auth::id();
        
        Journal::create($validated);
        
        return redirect()->route('journals.index')
            ->with('success', 'Journal entry created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Journal $journal)
    {
        $this->authorize('view', $journal);
        
        return inertia('Journals/Show', [
            'journal' => $journal,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Journal $journal)
    {
        $this->authorize('update', $journal);
        
        return inertia('Journals/Edit', [
            'journal' => $journal,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateJournalRequest $request, Journal $journal)
    {
        $this->authorize('update', $journal);
        
        $validated = $request->validated();
        $journal->update($validated);
        
        return redirect()->route('journals.index')
            ->with('success', 'Journal entry updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Journal $journal)
    {
        $this->authorize('delete', $journal);
        
        $journal->delete();
        
        return redirect()->route('journals.index')
            ->with('success', 'Journal entry deleted successfully!');
    }
}
