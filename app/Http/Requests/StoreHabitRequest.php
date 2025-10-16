<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreHabitRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'target' => 'nullable|integer|min:1|max:365',
            'book_id' => 'nullable|exists:books,id',
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'A habit name is required.',
            'target.integer' => 'Target must be a number.',
            'target.min' => 'Target must be at least 1.',
            'target.max' => 'Target cannot exceed 365 days.',
            'book_id.exists' => 'Selected book does not exist.',
        ];
    }
}
