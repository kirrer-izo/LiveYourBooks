<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IntegrationSettingRequest extends FormRequest
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
        $integration = $this->route('integrationSetting');

        return [
            'service' => [
                'required',
                'string',
                'max:100',
                Rule::unique('integration_settings', 'service')->ignore($integration?->id),
            ],
            'display_name' => ['required', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
            'status' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
            'settings' => ['nullable', 'array'],
            'last_checked_at' => ['nullable', 'date'],
        ];
    }
}

