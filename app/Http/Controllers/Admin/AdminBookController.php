<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminBookController extends Controller
{
    /**
     * Display a listing of the books with filters.
     */
    public function index(Request $request): Response
    {
        $query = Book::query();

        $search = (string) $request->string('search');
        if ($search !== '') {
            $query->where(function ($sub) use ($search) {
                $sub->where('title', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('genre', 'like', "%{$search}%")
                    ->orWhere('life_area', 'like', "%{$search}%");
            });
        }

        $books = $query
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Book $book) => [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'genre' => $book->genre,
                'life_area' => $book->life_area,
                'isbn' => $book->isbn,
                'description' => $book->description,
                'is_featured' => (bool) ($book->is_featured ?? false),
                'created_at' => optional($book->created_at)->toAtomString(),
            ]);

        return Inertia::render('Admin/Books', [
            'books' => $books,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created book.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'genre' => ['nullable', 'string', 'max:255'],
            'life_area' => ['nullable', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_featured' => ['nullable', 'boolean'],
        ]);

        Book::create($data);

        return redirect()->back()->with('success', 'Book created.');
    }

    /**
     * Update the specified book.
     */
    public function update(Request $request, Book $book): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'genre' => ['nullable', 'string', 'max:255'],
            'life_area' => ['nullable', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_featured' => ['nullable', 'boolean'],
        ]);

        $book->update($data);

        return redirect()->back()->with('success', 'Book updated.');
    }

    /**
     * Remove the specified book from storage.
     */
    public function destroy(Request $request, Book $book): RedirectResponse
    {
        $book->delete();
        return redirect()->back()->with('success', 'Book deleted.');
    }
}
