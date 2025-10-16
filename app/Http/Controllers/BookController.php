<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Http\Requests\StoreBookRequest;
use App\Http\Requests\UpdateBookRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Enums\Genre;
use App\Enums\LifeArea;
use Smalot\PdfParser\Parser as PdfParser;

class BookController extends Controller
{

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

        if ($status === 'reading') {
            $query->where('progress', '<', 100);
        } elseif ($status === 'completed') {
            $query->where('progress', 100);
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
        $validated = $request->validated();
        
        // Handle file upload
        if ($request->hasFile('cover_img')) {
            $file = $request->file('cover_img');
            $path = $file->store('book-covers', 'public');
            $validated['cover_img'] = $path; // store PDF path in cover_img

            // Extract title and author from uploaded PDF
            $bookInfo = ['title' => null, 'author' => null];
            try {
                Log::info('Starting PDF extraction for: ' . $file->getClientOriginalName());
                $bookInfo = $this->extractBookInfoFromPdf($file);
                Log::info('PDF extraction result', $bookInfo);
            } catch (\Throwable $e) {
                Log::error('Book info extraction failed', ['error' => $e->getMessage()]);
            }

            // Fallback: try to derive title from original filename if still unknown
            $derivedTitle = null;
            if (empty($bookInfo['title'])) {
                $original = $file->getClientOriginalName();
                $basename = pathinfo($original, PATHINFO_FILENAME);
                
                // Clean up common prefixes like "_OceanofPDF.com_"
                $cleaned = preg_replace('/^[_\-]*[a-zA-Z0-9]*of[a-zA-Z]*\.com[_\-]*/', '', $basename);
                $cleaned = preg_replace('/^[_\-]+|[_\-]+$/', '', $cleaned);
                $derivedTitle = trim(preg_replace('/[_-]+/', ' ', (string)$cleaned));
            }

            $validated['title'] = !empty($bookInfo['title'])
                ? $bookInfo['title']
                : (!empty($derivedTitle) ? $derivedTitle : ($validated['title'] ?? 'Unknown Title'));
            // If author missing, try filename pattern: "Title - Author" or "Author - Title"
            if (empty($bookInfo['author'])) {
                $original = $file->getClientOriginalName();
                $base = pathinfo($original, PATHINFO_FILENAME);
                
                // Clean up the base filename like we did for title
                $cleanBase = preg_replace('/^[_\-]*[a-zA-Z0-9]*of[a-zA-Z]*\.com[_\-]*/', '', $base);
                $cleanBase = preg_replace('/^[_\-]+|[_\-]+$/', '', $cleanBase);
                $cleanBase = trim(preg_replace('/[_-]+/', ' ', (string)$cleanBase));
                
                if (str_contains($cleanBase, ' - ')) {
                    [$left, $right] = array_map('trim', explode(' - ', $cleanBase, 2));
                    // Prefer author on right if title already matched derivedTitle
                    if (!empty($derivedTitle) && strcasecmp($derivedTitle, $left) === 0) {
                        $bookInfo['author'] = $right;
                    } elseif (!empty($derivedTitle) && strcasecmp($derivedTitle, $right) === 0) {
                        $bookInfo['author'] = $left;
                    } else {
                        // Heuristic: if left has 2+ words with capitals, treat as author
                        if (preg_match_all('/\b[A-Z][a-z]+\b/', $left) >= 2) {
                            $bookInfo['author'] = $left;
                        } elseif (preg_match_all('/\b[A-Z][a-z]+\b/', $right) >= 2) {
                            $bookInfo['author'] = $right;
                        }
                    }
                }
            }
            $validated['author'] = !empty($bookInfo['author']) ? $bookInfo['author'] : ($validated['author'] ?? 'Unknown Author');
        }
        
        $validated['user_id'] = Auth::id();
        $validated['progress'] = 0;
        $validated['is_completed'] = false;
        
        Book::create($validated);
        
        return redirect()->route('books.index')
            ->with('success', 'Book added successfully!');
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
                    'title' => trim((string)$byteInfo['title']),
                    'author' => trim((string)$byteInfo['author']),
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
                return ['title' => trim((string)$metaTitle), 'author' => trim((string)$metaAuthor)];
            }

            // If only one of title/author was found from bytes, complement it here
            if ((!empty($byteInfo['title']) || !empty($byteInfo['author'])) && (empty($metaTitle) || empty($metaAuthor))) {
                return [
                    'title' => !empty($byteInfo['title']) ? trim((string)$byteInfo['title']) : 'Unknown Title',
                    'author' => !empty($byteInfo['author']) ? trim((string)$byteInfo['author']) : 'Unknown Author',
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
                    'title' => $guessTitle ?: 'Unknown Title',
                    'author' => $guessAuthor ?: 'Unknown Author',
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
}
