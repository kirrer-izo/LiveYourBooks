<?php

/**
 * Helper function to sanitize UTF-8 strings
 * Removes invalid UTF-8 characters that can cause JSON encoding errors
 */
if (!function_exists('sanitize_utf8')) {
    function sanitize_utf8($string): string
    {
        if (!is_string($string)) {
            return '';
        }
        
        // Remove invalid UTF-8 characters
        $string = mb_convert_encoding($string, 'UTF-8', 'UTF-8');
        
        // Remove null bytes and other control characters except newlines and tabs
        $string = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $string);
        
        return $string;
    }
}

/**
 * Recursively sanitize UTF-8 in arrays
 */
if (!function_exists('sanitize_utf8_array')) {
    function sanitize_utf8_array(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $data[$key] = sanitize_utf8($value);
            } elseif (is_array($value)) {
                $data[$key] = sanitize_utf8_array($value);
            }
        }
        return $data;
    }
}

