<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookRequest extends FormRequest
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
            'genre' => ['nullable', 'string', 'in:Fiction,Non-fiction,Biography,Self-help,Philosophy,Spirituality,Science,History,Poetry,Business,Personal Development'],
            'life_area' => ['nullable', 'string', 'in:Health,Relationships,Career,Finance,Spirituality,Personal Growth,Emotional Wellbeing,Productivity,Mindfulness,Purpose'],
            'cover_img' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ];
    }
}
