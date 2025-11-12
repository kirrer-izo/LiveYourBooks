<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BookCatalogEntryRequest;
use App\Models\BookCatalogEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminBookCatalogController extends Controller
{
    /**
     * Display the centralized book catalog entries.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');
        $onlyFeatured = $request->boolean('featured');

        $query = BookCatalogEntry::query();

        if ($search !== '') {
            $query->where(function ($sub) use ($search) {
                $sub->where('title', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('genre', 'like', "%{$search}%")
                    ->orWhere('life_area', 'like', "%{$search}%");
            });
        }

        if ($onlyFeatured) {
            $query->where('is_featured', true);
        }

        $entries = $query
            ->orderBy('title')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (BookCatalogEntry $entry) => [
                'id' => $entry->id,
                'title' => $entry->title,
                'author' => $entry->author,
                'genre' => $entry->genre,
                'life_area' => $entry->life_area,
                'isbn' => $entry->isbn,
                'description' => $entry->description,
                'is_featured' => (bool) $entry->is_featured,
                'created_at' => $entry->created_at?->toAtomString(),
            ]);

        $featuredCount = BookCatalogEntry::where('is_featured', true)->count();

        return Inertia::render('Admin/Catalog', [
            'entries' => $entries,
            'filters' => [
                'search' => $search,
                'featured' => $onlyFeatured,
            ],
            'featuredCount' => $featuredCount,
        ]);
    }

    /**
     * Store a new catalog entry.
     */
    public function store(BookCatalogEntryRequest $request): RedirectResponse
    {
        BookCatalogEntry::create($request->validated());

        return redirect()->back()->with('success', 'Catalog entry created successfully.');
    }

    /**
     * Update the specified catalog entry.
     */
    public function update(BookCatalogEntryRequest $request, BookCatalogEntry $bookCatalogEntry): RedirectResponse
    {
        $bookCatalogEntry->update($request->validated());

        return redirect()->back()->with('success', 'Catalog entry updated successfully.');
    }

    /**
     * Remove the specified catalog entry.
     */
    public function destroy(BookCatalogEntry $bookCatalogEntry): RedirectResponse
    {
        $bookCatalogEntry->delete();

        return redirect()->back()->with('success', 'Catalog entry removed.');
    }
}

