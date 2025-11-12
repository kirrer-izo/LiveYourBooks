<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BookCatalogEntryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'genre' => ['nullable', 'string', 'max:120'],
            'life_area' => ['nullable', 'string', 'max:120'],
            'isbn' => ['nullable', 'string', 'max:32'],
            'description' => ['nullable', 'string'],
            'is_featured' => ['sometimes', 'boolean'],
        ];
    }
}

