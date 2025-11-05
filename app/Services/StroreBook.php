<?php

namespace App\Services;

use Smalot\PdfParser\Parser;

class StroreBook {

    public function extractInfo(string $filePath): array{

        $parser = new Parser();
        $pdf = $parser->parseFile($filePath);
        $details = $pdf->getDetails();

        return [
            'title' => $details['Title'] ?? null,
            'author' => $details['Author'] ?? null,
        ];
    }
}