<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBookCatalogEntryRequest;
use App\Http\Requests\Admin\UpdateBookCatalogEntryRequest;
use App\Models\BookCatalogEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookCatalogController extends Controller
{
    /**
     * Display the current catalog entries.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'featured']);

        $entries = BookCatalogEntry::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('author', 'like', "%{$search}%")
                        ->orWhere('genre', 'like', "%{$search}%")
                        ->orWhere('life_area', 'like', "%{$search}%");
                });
            })
            ->when($filters['featured'] ?? null, fn ($query, $featured) => $query->where('is_featured', $featured === 'true'))
            ->orderByDesc('is_featured')
            ->orderBy('title')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Catalog', [
            'entries' => $entries,
            'filters' => $filters,
        ]);
    }

    /**
     * Store a new catalog entry.
     */
    public function store(StoreBookCatalogEntryRequest $request): RedirectResponse
    {
        BookCatalogEntry::create($request->validated());

        return redirect()->back()->with('success', 'Catalog entry created.');
    }

    /**
     * Update an existing catalog entry.
     */
    public function update(UpdateBookCatalogEntryRequest $request, BookCatalogEntry $entry): RedirectResponse
    {
        $entry->fill($request->validated());
        $entry->save();

        return redirect()->back()->with('success', 'Catalog entry updated.');
    }

    /**
     * Delete a catalog entry.
     */
    public function destroy(BookCatalogEntry $entry): RedirectResponse
    {
        $entry->delete();

        return redirect()->back()->with('success', 'Catalog entry removed.');
    }
}

