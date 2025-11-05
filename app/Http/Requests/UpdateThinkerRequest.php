<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\ThinkerType;

class UpdateThinkerRequest extends FormRequest
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
        $thinker = $this->route('thinker');
        
        $rules = [
            'is_active' => 'sometimes|boolean',
        ];

        // Only allow updating custom thinkers
        if ($thinker && $thinker->isCustom()) {
            $rules['name'] = 'sometimes|required|string|max:255';
            $rules['description'] = 'sometimes|nullable|string|max:1000';
            $rules['advice_style'] = 'sometimes|nullable|string|max:1000';
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Name is required for custom thinkers.',
            'name.max' => 'Name must not exceed 255 characters.',
            'description.max' => 'Description must not exceed 1000 characters.',
            'advice_style.max' => 'Advice style must not exceed 1000 characters.',
            'is_active.boolean' => 'Active status must be true or false.',
        ];
    }
}
