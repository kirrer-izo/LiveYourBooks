<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:255'], // Made nullable - controller will ensure it's never empty
            'author' => ['nullable', 'string', 'max:255'],
            'genre' => ['nullable', 'string', 'in:Fiction,Non-fiction,Biography,Self-help,Philosophy,Spirituality,Science,History,Poetry,Business,Personal Development'],
            'life_area' => ['nullable', 'string', 'in:Health,Relationships,Career,Finance,Spirituality,Personal Growth,Emotional Wellbeing,Productivity,Mindfulness,Purpose'],
            'cover_img' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Book title is required.',
            'title.max' => 'Book title must not exceed 255 characters.',
            'author.max' => 'Author name must not exceed 255 characters.',
            'cover_img.image' => 'Cover image must be an image file.',
            'cover_img.mimes' => 'Cover image must be a JPEG, PNG, JPG, or GIF file.',
            'cover_img.max' => 'Cover image must not exceed 2MB.',
        ];
    }
}
