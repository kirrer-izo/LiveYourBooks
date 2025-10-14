<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Http\Requests\StoreBookRequest;
use App\Http\Requests\UpdateBookRequest;
use Illuminate\Support\Facades\Auth;

class BookController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $books = Book::where('user_id', Auth::id())
        ->paginate(10);

        return inertia('Books/Index', ['books' => $books]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('Books/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBookRequest $request)
    {
        $validated = $request->validated();
        
        // Handle file upload
        if ($request->hasFile('cover_img')) {
            $path = $request->file('cover_img')->store('book-covers', 'public');
            $validated['cover_img'] = $path;
            
            // Extract title and author from book cover
            $bookInfo = $this->extractBookInfoFromImage($request->file('cover_img'));
            $validated['title'] = $bookInfo['title'] ?? 'Unknown Title';
            $validated['author'] = $bookInfo['author'] ?? 'Unknown Author';
        }
        
        $validated['user_id'] = Auth::id();
        $validated['progress'] = 0;
        $validated['is_completed'] = false;
        
        Book::create($validated);
        
        return redirect()->route('books.index')
            ->with('success', 'Book added successfully!');
    }

    /**
     * Extract book title and author from book cover image using OCR and Google Books API
     */
    private function extractBookInfoFromImage($imageFile)
    {
        try {
            // Step 1: Use Tesseract OCR to extract text from the image
            $extractedText = $this->performOCR($imageFile);
            
            // Step 2: Use Google Books API to find the book
            $bookInfo = $this->searchGoogleBooks($extractedText);
            
            return $bookInfo;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error extracting book info: ' . $e->getMessage());
            return ['title' => 'Unknown Title', 'author' => 'Unknown Author'];
        }
    }

    /**
     * Perform OCR on the image using Tesseract
     */
    private function performOCR($imageFile)
    {
        // Save temporary image
        $tempPath = $imageFile->store('temp', 'local');
        $fullPath = storage_path('app/' . $tempPath);
        
        try {
            // Use exec to run tesseract command
            // Note: Tesseract must be installed on the system
            $output = [];
            $returnCode = 0;
            
            // Run tesseract command
            exec("tesseract \"$fullPath\" stdout 2>/dev/null", $output, $returnCode);
            
            // Clean up temp file
            \Illuminate\Support\Facades\File::delete($fullPath);
            
            if ($returnCode === 0 && !empty($output)) {
                return implode(' ', $output);
            }
            
            return '';
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('OCR Error: ' . $e->getMessage());
            \Illuminate\Support\Facades\File::delete($fullPath);
            return '';
        }
    }

    /**
     * Search Google Books API for book information
     */
    private function searchGoogleBooks($searchQuery)
    {
        try {
            // Clean up the search query
            $searchQuery = preg_replace('/\s+/', ' ', trim($searchQuery));
            
            // Limit search query to first 100 characters
            $searchQuery = substr($searchQuery, 0, 100);
            
            if (empty($searchQuery)) {
                return ['title' => 'Unknown Title', 'author' => 'Unknown Author'];
            }
            
            // Make request to Google Books API
            $client = new \GuzzleHttp\Client();
            $response = $client->get('https://www.googleapis.com/books/v1/volumes', [
                'query' => [
                    'q' => $searchQuery,
                    'maxResults' => 1,
                    'langRestrict' => 'en'
                ]
            ]);
            
            $data = json_decode($response->getBody(), true);
            
            if (isset($data['items'][0]['volumeInfo'])) {
                $volumeInfo = $data['items'][0]['volumeInfo'];
                
                return [
                    'title' => $volumeInfo['title'] ?? 'Unknown Title',
                    'author' => isset($volumeInfo['authors']) ? implode(', ', $volumeInfo['authors']) : 'Unknown Author'
                ];
            }
            
            return ['title' => 'Unknown Title', 'author' => 'Unknown Author'];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google Books API Error: ' . $e->getMessage());
            return ['title' => 'Unknown Title', 'author' => 'Unknown Author'];
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Book $book)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Book $book)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBookRequest $request, Book $book)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Book $book)
    {
        //
    }
}
