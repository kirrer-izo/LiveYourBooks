<?php

namespace App\Services;

use App\Models\Book;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookUploadService
{
    private const ALLOWED_TYPES = ['pdf', 'epub', 'txt'];
    private const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    public function uploadBook(User $user, UploadedFile $file, array $bookData): Book
    {
        $this->validateFile($file);
        
        // Ensure title exists - use filename if not provided
        if (empty($bookData['title'])) {
            $bookData['title'] = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        }
        
        $fileType = $file->getClientOriginalExtension();
        $fileName = $this->generateFileName($file, $bookData['title']);
        $filePath = $this->storeFile($file, $fileName);
        
        $bookData = array_merge($bookData, [
            'user_id' => $user->id,
            'file_path' => $filePath,
            'file_type' => $fileType,
            'file_size' => $file->getSize(),
        ]);

        return Book::create($bookData);
    }

    public function updateBookFile(Book $book, UploadedFile $file): Book
    {
        $this->validateFile($file);
        
        // Delete old file if exists
        if ($book->file_path && Storage::disk('private')->exists($book->file_path)) {
            Storage::disk('private')->delete($book->file_path);
        }
        
        $fileType = $file->getClientOriginalExtension();
        $fileName = $this->generateFileName($file, $book->title);
        $filePath = $this->storeFile($file, $fileName);
        
        $book->update([
            'file_path' => $filePath,
            'file_type' => $fileType,
            'file_size' => $file->getSize(),
        ]);

        return $book;
    }

    public function deleteBookFile(Book $book): void
    {
        if ($book->file_path && Storage::disk('private')->exists($book->file_path)) {
            Storage::disk('private')->delete($book->file_path);
        }
        
        $book->update([
            'file_path' => null,
            'file_type' => null,
            'file_size' => null,
        ]);
    }

    public function getBookContent(Book $book): ?string
    {
        if (!$book->file_path || !Storage::disk('private')->exists($book->file_path)) {
            return null;
        }

        $filePath = Storage::disk('private')->path($book->file_path);
        
        switch ($book->file_type) {
            case 'txt':
                return file_get_contents($filePath);
            case 'pdf':
                return $this->extractPdfText($filePath);
            case 'epub':
                return $this->extractEpubText($filePath);
            default:
                return null;
        }
    }

    private function validateFile(UploadedFile $file): void
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        $user = auth()->user();
        $allowedTypes = self::ALLOWED_TYPES;

        // Restrict non-admin users to text only
        if ($user && $user->role !== \App\Enums\UserRole::Admin) {
            $allowedTypes = ['txt'];
        }
        
        if (!in_array($extension, $allowedTypes)) {
            $message = 'Invalid file type. ';
            if ($user && $user->role !== \App\Enums\UserRole::Admin) {
                $message .= 'Free users can only upload .txt files.';
            } else {
                $message .= 'Allowed types: ' . implode(', ', self::ALLOWED_TYPES);
            }
            throw new \InvalidArgumentException($message);
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException(
                'File too large. Maximum size: ' . (self::MAX_FILE_SIZE / 1024 / 1024) . 'MB'
            );
        }
    }

    private function generateFileName(UploadedFile $file, string $title): string
    {
        $extension = $file->getClientOriginalExtension();
        $slug = Str::slug($title);
        $timestamp = now()->format('Y-m-d_H-i-s');
        
        return "books/{$slug}_{$timestamp}.{$extension}";
    }

    private function storeFile(UploadedFile $file, string $fileName): string
    {
        return $file->storeAs('', $fileName, 'private');
    }

    private function extractPdfText(string $filePath): string
    {
        // For now, return a placeholder. In production, you'd use a PDF parsing library
        // like smalot/pdfparser or similar
        return "PDF content extraction not implemented yet. File: " . basename($filePath);
    }

    private function extractEpubText(string $filePath): string
    {
        // For now, return a placeholder. In production, you'd use an EPUB parsing library
        return "EPUB content extraction not implemented yet. File: " . basename($filePath);
    }

    public function getFileUrl(Book $book): ?string
    {
        if (!$book->file_path) {
            return null;
        }

        // Private disk doesn't have public URLs, return download route instead
        return route('books.download', $book);
    }

    public function getDownloadUrl(Book $book): ?string
    {
        if (!$book->file_path || !Storage::disk('private')->exists($book->file_path)) {
            return null;
        }

        return route('books.download', $book);
    }
}
