<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
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
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'priority' => 'required|in:low,medium,high',
            'due_date' => 'nullable|date|after_or_equal:today',
            'book_id' => 'nullable|exists:books,id',
            'habit_id' => 'nullable|exists:habits,id',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'A task title is required.',
            'priority.required' => 'Please select a priority level.',
            'priority.in' => 'Priority must be low, medium, or high.',
            'due_date.after_or_equal' => 'Due date cannot be in the past.',
            'book_id.exists' => 'Selected book does not exist.',
            'habit_id.exists' => 'Selected habit does not exist.',
        ];
    }
}
