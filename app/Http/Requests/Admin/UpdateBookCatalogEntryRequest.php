<?php

namespace App\Http\Requests\Admin;

class UpdateBookCatalogEntryRequest extends StoreBookCatalogEntryRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return collect(parent::rules())
            ->mapWithKeys(function ($rule, $key) {
                return [$key => array_merge(['sometimes'], (array) $rule)];
            })
            ->all();
    }
}

