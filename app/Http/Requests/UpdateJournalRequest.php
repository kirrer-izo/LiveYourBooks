<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJournalRequest extends FormRequest
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
            'content' => 'required|string|max:10000',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'entry_date' => 'required|date',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'A title is required for your journal entry.',
            'content.required' => 'Please write some content for your journal entry.',
            'content.max' => 'Journal content cannot exceed 10,000 characters.',
            'entry_date.required' => 'Please select a date for this entry.',
        ];
    }
}
