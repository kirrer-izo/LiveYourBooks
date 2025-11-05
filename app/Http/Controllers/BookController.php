<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Http\Requests\StoreBookRequest;
use App\Http\Requests\UpdateBookRequest;
use App\Services\BookUploadService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Enums\Genre;
use App\Enums\LifeArea;
use Smalot\PdfParser\Parser as PdfParser;

class BookController extends Controller
{
    public function __construct(
        private BookUploadService $bookUploadService
    ) {}

    public function index()
    {
        $q = request('q');
        $status = request('status', 'all');
        $category = request('category', 'all');

        $genres = array_map(fn ($c) => $c->value, Genre::cases());
        $lifeAreas = array_map(fn ($c) => $c->value, LifeArea::cases());

        $query = Book::where('user_id', Auth::id());

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('author', 'like', "%{$q}%");
            });
        }

        if ($status === 'completed') {
            $query->where('is_completed', true);
        } elseif ($status === 'reading') {
            $query->where('is_completed', false);
        }

        if ($category && $category !== 'all') {
            if (in_array($category, $genres, true)) {
                $query->where('genre', $category);
            } elseif (in_array($category, $lifeAreas, true)) {
                $query->where('life_area', $category);
            }
        }

        $books = $query->orderByDesc('created_at')->paginate(10)->withQueryString();

        $books->getCollection()->transform(function ($book) {
            // Sanitize UTF-8 strings to prevent encoding errors
            if ($book->title) {
                $book->title = $this->sanitizeUtf8($book->title);
            }
            if ($book->author) {
                $book->author = $this->sanitizeUtf8($book->author);
            }
            
            if ($book->cover_img) {
                $url = '/storage/' . ltrim($book->cover_img, '/');
                $ext = strtolower(pathinfo($book->cover_img, PATHINFO_EXTENSION));
                $book->cover_url = $url;
                $book->cover_is_pdf = ($ext === 'pdf');
                // keep cover_img for backward compatibility, but point to URL
                $book->cover_img = $url;
            } else {
                $book->cover_url = null;
                $book->cover_is_pdf = false;
            }
            return $book;
        });

        return inertia('Books/Index', [
            'books' => $books,
            'filters' => [
                'q' => $q,
                'status' => $status,
                'category' => $category,
            ],
            'genres' => $genres,
            'lifeAreas' => $lifeAreas,
        ]);
    }


    public function create()
    {
        $genres = array_map(fn ($c) => $c->value, Genre::cases());
        $lifeAreas = array_map(fn ($c) => $c->value, LifeArea::cases());
        return inertia('Books/Create', [
            'genres' => $genres,
            'lifeAreas' => $lifeAreas,
        ]);
    }


    public function store(StoreBookRequest $request)
    {
        try {
            $validated = $request->validated();
            
            // Sanitize UTF-8 strings before storing
            if (isset($validated['title'])) {
                $validated['title'] = $this->sanitizeUtf8($validated['title']);
            }
            if (isset($validated['author'])) {
                $validated['author'] = $this->sanitizeUtf8($validated['author']);
            }
            
            // Handle cover image upload
            if ($request->hasFile('cover_img')) {
                $coverFile = $request->file('cover_img');
                $coverPath = $coverFile->store('book-covers', 'public');
                $validated['cover_img'] = $coverPath;
            }
            
            // Handle book file upload
            if ($request->hasFile('book_file')) {
                $bookFile = $request->file('book_file');
                
                // Extract book info from PDF if title/author are missing
                if (empty($validated['title']) || empty($validated['author'])) {
                    if ($bookFile->getClientOriginalExtension() === 'pdf') {
                        try {
                            $extractedInfo = $this->extractBookInfoFromPdf($bookFile);
                            if (empty($validated['title']) && !empty($extractedInfo['title'])) {
                                $validated['title'] = $this->sanitizeUtf8($extractedInfo['title']);
                            }
                            if (empty($validated['author']) && !empty($extractedInfo['author'])) {
                                $validated['author'] = $this->sanitizeUtf8($extractedInfo['author']);
                            }
                        } catch (\Exception $e) {
                            Log::warning('Failed to extract book info from PDF', ['error' => $e->getMessage()]);
                            // Continue with defaults if extraction fails
                        }
                    }
                }
                
                // Ensure title exists (required field)
                if (empty($validated['title'])) {
                    $validated['title'] = $bookFile->getClientOriginalName();
                }
                
                $book = $this->bookUploadService->uploadBook(Auth::user(), $bookFile, $validated);
            } else {
                // Create book without file (manual entry)
                $validated['user_id'] = Auth::id();
                $validated['is_completed'] = false;
                $book = Book::create($validated);
            }
            
            return redirect()->route('books.index')
                ->with('success', 'Book added successfully!');
                
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()
                ->withErrors(['book_file' => $e->getMessage()])
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Book upload failed', ['error' => $e->getMessage()]);
            return redirect()->back()
                ->withErrors(['error' => 'Failed to upload book. Please try again.'])
                ->withInput();
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
                    'title' => $this->sanitizeUtf8($volumeInfo['title'] ?? 'Unknown Title'),
                    'author' => isset($volumeInfo['authors']) ? $this->sanitizeUtf8(implode(', ', $volumeInfo['authors'])) : 'Unknown Author'
                ];
            }
            
            return ['title' => 'Unknown Title', 'author' => 'Unknown Author'];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google Books API Error: ' . $e->getMessage());
            return ['title' => 'Unknown Title', 'author' => 'Unknown Author'];
        }
    }

    /**
     * Extract book info from a PDF file using:
     * 1) Metadata (Title/Author)
     * 2) Heuristics over first pages to guess Title and Author
     * 3) Fallback to Google Books with concatenated page text
     */
    private function extractBookInfoFromPdf($pdfFile)
    {
        // Use the uploaded file's real path directly
        $realPath = $pdfFile->getRealPath();
        Log::info('Using file path for extraction', ['path' => $realPath]);
        
        try {
            // 0) Try extracting from raw PDF bytes (Info dictionary / XMP)
            $byteInfo = $this->extractInfoFromPdfBytes($realPath);
            Log::info('Raw bytes extraction result', $byteInfo);
            if (!empty($byteInfo['title']) && !empty($byteInfo['author'])) {
                Log::info('Found complete info from raw bytes, returning early');
                return [
                    'title' => $this->sanitizeUtf8(trim((string)$byteInfo['title'])),
                    'author' => $this->sanitizeUtf8(trim((string)$byteInfo['author'])),
                ];
            }

            $parser = new PdfParser();
            $pdf = $parser->parseFile($realPath);

            // 1) Try PDF metadata (Title/Author)
            $details = $pdf->getDetails();
            Log::info('PDF parser details', ['details' => $details]);
            $metaTitle = null;
            $metaAuthor = null;
            if (is_array($details)) {
                foreach ($details as $key => $value) {
                    $k = strtolower((string)$key);
                    if ($k === 'title' && !empty($value)) {
                        $metaTitle = is_array($value) ? ($value[0] ?? null) : $value;
                    }
                    if (($k === 'author' || $k === 'creator') && !empty($value)) {
                        $metaAuthor = is_array($value) ? ($value[0] ?? null) : $value;
                    }
                }
            }
            Log::info('Extracted from parser metadata', ['title' => $metaTitle, 'author' => $metaAuthor]);
            if (!empty($metaTitle) && !empty($metaAuthor)) {
                Log::info('Found complete info from parser metadata, returning early');
                return [
                    'title' => $this->sanitizeUtf8(trim((string)$metaTitle)),
                    'author' => $this->sanitizeUtf8(trim((string)$metaAuthor)),
                ];
            }

            // If only one of title/author was found from bytes, complement it here
            if ((!empty($byteInfo['title']) || !empty($byteInfo['author'])) && (empty($metaTitle) || empty($metaAuthor))) {
                return [
                    'title' => !empty($byteInfo['title']) ? $this->sanitizeUtf8(trim((string)$byteInfo['title'])) : 'Unknown Title',
                    'author' => !empty($byteInfo['author']) ? $this->sanitizeUtf8(trim((string)$byteInfo['author'])) : 'Unknown Author',
                ];
            }

            // 2) Heuristic parsing across first pages
            $pages = $pdf->getPages();
            $maxPages = 8;
            $pageCount = is_array($pages) ? min(count($pages), $maxPages) : 0;
            $allText = '';
            $guessTitle = null;
            $guessAuthor = null;

            $isLikelyName = function (string $line): bool {
                // Two to four words starting with capital letters, allow hyphens and apostrophes
                $words = preg_split('/\s+/', trim($line));
                $words = array_values(array_filter($words));
                if (count($words) < 2 || count($words) > 6) return false;
                $caps = 0;
                foreach ($words as $w) {
                    if (preg_match("/^[A-Z][a-z'\-]+$/u", $w)) $caps++;
                }
                return $caps >= max(2, (int)floor(count($words) * 0.6));
            };

            $isLikelyTitle = function (string $line): bool {
                $len = mb_strlen($line);
                if ($len < 3 || $len > 100) return false;
                $low = mb_strtolower($line);
                // exclude common non-title lines
                $ban = ['contents', 'copyright', 'chapter', 'introduction', 'acknowledg', 'index', 'foreword', 'preface'];
                foreach ($ban as $b) {
                    if (str_contains($low, $b)) return false;
                }
                // too many digits -> likely page footer/header
                if (preg_match('/\d{3,}/', $line)) return false;
                // at least 60% letters
                $letters = preg_match_all('/[\p{L}]/u', $line);
                return $letters >= ($len * 0.6);
            };

            for ($i = 0; $i < $pageCount; $i++) {
                $pageText = (string)$pages[$i]->getText();
                $allText .= "\n" . $pageText;
                // normalize and split lines
                $lines = preg_split('/\R+/', trim($pageText));
                $clean = [];
                foreach ($lines as $ln) {
                    $ln = trim(preg_replace('/\s+/', ' ', (string)$ln));
                    if ($ln === '') continue;
                    $clean[] = $ln;
                }
                
                // Log first page content for debugging
                if ($i === 0) {
                    Log::info('First page lines (first 10)', ['lines' => array_slice($clean, 0, 10)]);
                }

                // try explicit markers for author
                foreach ($clean as $ln) {
                    if (!$guessAuthor && preg_match('/^by\s+(.{3,80})$/i', $ln, $m)) {
                        $guessAuthor = trim($m[1]);
                        break;
                    }
                    if (!$guessAuthor && preg_match('/^author\s*[:\-]\s*(.{3,80})$/i', $ln, $m)) {
                        $guessAuthor = trim($m[1]);
                        break;
                    }
                }

                // guess title from top portion of first pages
                $limit = min(15, count($clean));
                for ($j = 0; $j < $limit; $j++) {
                    $ln = $clean[$j];
                    if (!$guessTitle && $isLikelyTitle($ln)) {
                        $guessTitle = $ln;
                        break;
                    }
                }

                // fallback author: a proper name line near where 'by' often appears
                if (!$guessAuthor) {
                    for ($j = 0; $j < min(25, count($clean)); $j++) {
                        $ln = $clean[$j];
                        if ($isLikelyName($ln)) {
                            // avoid taking the same as title
                            if (!$guessTitle || mb_strtolower($ln) !== mb_strtolower($guessTitle)) {
                                $guessAuthor = $ln;
                                break;
                            }
                        }
                    }
                }

                if ($guessTitle && $guessAuthor) break;
            }

            Log::info('Heuristic extraction results', ['guessTitle' => $guessTitle, 'guessAuthor' => $guessAuthor]);
            if ($guessTitle || $guessAuthor) {
                Log::info('Found info from heuristics, returning');
                return [
                    'title' => $guessTitle ? $this->sanitizeUtf8($guessTitle) : 'Unknown Title',
                    'author' => $guessAuthor ? $this->sanitizeUtf8($guessAuthor) : 'Unknown Author',
                ];
            }

            // 3) Fallback: use concatenated text for Google Books search
            $text = preg_replace('/\s+/', ' ', trim((string)$allText));
            $text = substr($text, 0, 1500);
            if (!$text) {
                return ['title' => 'Unknown Title', 'author' => 'Unknown Author'];
            }
            return $this->searchGoogleBooks($text);
        } catch (\Throwable $e) {
            Log::error('PDF parse error: ' . $e->getMessage());
            return ['title' => 'Unknown Title', 'author' => 'Unknown Author'];
        }
    }

    /**
     * Sanitize UTF-8 string to prevent encoding errors
     */
    private function sanitizeUtf8(?string $string): string
    {
        if (empty($string)) {
            return '';
        }
        
        // Convert to UTF-8, replacing invalid characters instead of removing them
        $string = mb_convert_encoding($string, 'UTF-8', 'UTF-8');
        
        // Remove BOM and replacement characters
        $string = preg_replace('/^\xEF\xBB\xBF/', '', $string); // Remove UTF-8 BOM
        $string = str_replace("\xEF\xBF\xBD", '', $string); // Remove replacement character
        
        // Remove null bytes and dangerous control characters (but be less aggressive)
        $string = preg_replace('/[\x00]/', '', $string); // Remove null bytes only
        
        // Trim whitespace
        $string = trim($string);
        
        return $string;
    }

    /**
     * Extract title/author from raw PDF bytes (Info dictionary and XMP blocks)
     */
    private function extractInfoFromPdfBytes(string $pdfPath): array
    {
        $result = ['title' => null, 'author' => null];
        try {
            $maxBytes = 2 * 1024 * 1024; // read up to 2MB
            $head = @file_get_contents($pdfPath, false, null, 0, $maxBytes);
            $tail = '';
            $size = @filesize($pdfPath) ?: 0;
            if ($size > $maxBytes) {
                $offset = max(0, $size - $maxBytes);
                $fh = @fopen($pdfPath, 'rb');
                if ($fh) {
                    @fseek($fh, $offset);
                    $tail = @fread($fh, $maxBytes) ?: '';
                    @fclose($fh);
                }
            }
            $contents = ($head ?: '') . "\n" . ($tail ?: '');
            if ($contents === '') {
                return $result;
            }

            // Info dictionary patterns: /Title (..), /Author (..)
            if (preg_match('/\/Title\s*\(([^\)]*)\)/i', $contents, $m)) {
                $title = trim($m[1]);
                if ($title !== '') $result['title'] = $title;
            }
            if (preg_match('/\/Author\s*\(([^\)]*)\)/i', $contents, $m)) {
                $author = trim($m[1]);
                if ($author !== '') $result['author'] = $author;
            }

            // XMP: dc:title -> rdf:Alt -> rdf:li
            if (empty($result['title']) && preg_match('/<dc:title>.*?<rdf:Alt>.*?<rdf:li[^>]*>(.*?)<\/rdf:li>.*?<\/rdf:Alt>.*?<\/dc:title>/is', $contents, $m)) {
                $title = trim(strip_tags($m[1]));
                if ($title !== '') $result['title'] = html_entity_decode($title, ENT_QUOTES | ENT_XML1);
            }
            // XMP: simpler dc:title text content
            if (empty($result['title']) && preg_match('/<dc:title>(.*?)<\/dc:title>/is', $contents, $m)) {
                $title = trim(strip_tags($m[1]));
                if ($title !== '') $result['title'] = html_entity_decode($title, ENT_QUOTES | ENT_XML1);
            }
            // XMP: pdf:Author or dc:creator -> rdf:li
            if (empty($result['author']) && preg_match('/<pdf:Author>(.*?)<\/pdf:Author>/is', $contents, $m)) {
                $author = trim(strip_tags($m[1]));
                if ($author !== '') $result['author'] = html_entity_decode($author, ENT_QUOTES | ENT_XML1);
            }
            if (empty($result['author']) && preg_match('/<dc:creator>.*?<rdf:li[^>]*>(.*?)<\/rdf:li>.*?<\/dc:creator>/is', $contents, $m)) {
                $author = trim(strip_tags($m[1]));
                if ($author !== '') $result['author'] = html_entity_decode($author, ENT_QUOTES | ENT_XML1);
            }

            return $result;
        } catch (\Throwable $e) {
            return $result;
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Book $book)
    {
        $this->authorize('view', $book);
        
        // Sanitize UTF-8 strings to prevent encoding errors
        if ($book->title) {
            $book->title = $this->sanitizeUtf8($book->title);
        }
        if ($book->author) {
            $book->author = $this->sanitizeUtf8($book->author);
        }
        
        // Transform cover image URL
        if ($book->cover_img) {
            $url = '/storage/' . ltrim($book->cover_img, '/');
            $ext = strtolower(pathinfo($book->cover_img, PATHINFO_EXTENSION));
            $book->cover_url = $url;
            $book->cover_is_pdf = ($ext === 'pdf');
            $book->cover_img = $url;
        } else {
            $book->cover_url = null;
            $book->cover_is_pdf = false;
        }
        
        return inertia('Books/Show', [
            'book' => $book,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Book $book)
    {
        $this->authorize('update', $book);
        
        // Sanitize UTF-8 strings to prevent encoding errors
        if ($book->title) {
            $book->title = $this->sanitizeUtf8($book->title);
        }
        if ($book->author) {
            $book->author = $this->sanitizeUtf8($book->author);
        }
        
        $genres = array_map(fn ($c) => $c->value, Genre::cases());
        $lifeAreas = array_map(fn ($c) => $c->value, LifeArea::cases());
        
        return inertia('Books/Edit', [
            'book' => $book,
            'genres' => $genres,
            'lifeAreas' => $lifeAreas,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBookRequest $request, Book $book)
    {
        $this->authorize('update', $book);
        
        $validated = $request->validated();
        
        // Ensure title is always present - use existing title if not provided or empty
        if (empty($validated['title']) || trim($validated['title']) === '') {
            $validated['title'] = $book->title; // Use existing title
        }
        
        // Sanitize UTF-8 strings before storing
        if (isset($validated['title'])) {
            $originalTitle = $validated['title'];
            $validated['title'] = $this->sanitizeUtf8($validated['title']);
            
            // If sanitization removed everything, use original (with minimal cleanup)
            if (empty($validated['title']) && !empty($originalTitle)) {
                $validated['title'] = preg_replace('/[\x00]/', '', $originalTitle);
                $validated['title'] = trim($validated['title']);
            }
            
            // Final fallback: use existing book title if still empty
            if (empty($validated['title'])) {
                $validated['title'] = $this->sanitizeUtf8($book->title);
            }
            
            // Final check - if still empty, reject
            if (empty($validated['title'])) {
                return redirect()->back()
                    ->withErrors(['title' => 'Book title is required and cannot be empty.'])
                    ->withInput();
            }
        }
        
        if (isset($validated['author'])) {
            $validated['author'] = $this->sanitizeUtf8($validated['author']);
            // If author becomes empty after sanitization, preserve existing
            if (empty($validated['author']) && !empty($book->author)) {
                $validated['author'] = $this->sanitizeUtf8($book->author);
            }
        }
        
        // Handle file upload if new cover is provided
        if ($request->hasFile('cover_img')) {
            // Delete old cover if exists
            if ($book->cover_img) {
                Storage::disk('public')->delete($book->cover_img);
            }
            
            $file = $request->file('cover_img');
            $path = $file->store('book-covers', 'public');
            $validated['cover_img'] = $path;
        }
        
        $book->update($validated);
        
        return redirect()->route('books.index')
            ->with('success', 'Book updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Book $book)
    {
        $this->authorize('delete', $book);
        
        // Delete cover image if exists
        if ($book->cover_img) {
            Storage::disk('public')->delete($book->cover_img);
        }
        
        $book->delete();
        
        return redirect()->route('books.index')
            ->with('success', 'Book deleted successfully!');
    }

    /**
     * Open the book file in browser
     */
    public function download(Book $book)
    {
        $this->authorize('view', $book);
        
        if (!$book->file_path) {
            Log::warning('Book file_path is null', ['book_id' => $book->id]);
            abort(404, 'Book file not found');
        }
        
        if (!Storage::disk('private')->exists($book->file_path)) {
            Log::warning('Book file does not exist in storage', [
                'book_id' => $book->id,
                'file_path' => $book->file_path,
            ]);
            abort(404, 'Book file not found');
        }
        
        $filePath = Storage::disk('private')->path($book->file_path);
        
        // Verify file exists
        if (!file_exists($filePath)) {
            Log::error('Book file path does not exist on disk', [
                'book_id' => $book->id,
                'file_path' => $book->file_path,
                'absolute_path' => $filePath,
            ]);
            abort(404, 'Book file not found on disk');
        }
        
        $mimeType = match(strtolower($book->file_type ?? '')) {
            'pdf' => 'application/pdf',
            'txt' => 'text/plain',
            'epub' => 'application/epub+zip',
            default => 'application/octet-stream',
        };
        
        Log::info('Serving book file', [
            'book_id' => $book->id,
            'file_path' => $filePath,
            'mime_type' => $mimeType,
        ]);
        
        return response()->file($filePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . basename($book->file_path) . '"',
        ]);
    }

}
