<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\ThinkerType;

class StoreThinkerRequest extends FormRequest
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
        $type = $this->input('type');
        
        $rules = [
            'type' => 'required|string|in:' . implode(',', array_column(ThinkerType::cases(), 'value')),
        ];

        if ($type === ThinkerType::CUSTOM->value) {
            $rules['name'] = 'required|string|max:255';
            $rules['description'] = 'nullable|string|max:1000';
            $rules['advice_style'] = 'nullable|string|max:1000';
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'type.required' => 'Please select a thinker type.',
            'type.in' => 'Invalid thinker type selected.',
            'name.required' => 'Name is required for custom thinkers.',
            'name.max' => 'Name must not exceed 255 characters.',
            'description.max' => 'Description must not exceed 1000 characters.',
            'advice_style.max' => 'Advice style must not exceed 1000 characters.',
        ];
    }
}
