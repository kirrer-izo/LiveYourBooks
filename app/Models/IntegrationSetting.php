<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IntegrationSetting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'service',
        'display_name',
        'is_active',
        'status',
        'settings',
        'notes',
        'last_checked_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'is_active' => 'boolean',
            'last_checked_at' => 'datetime',
        ];
    }

    /**
     * Get a masked representation of sensitive settings values.
     */
    public function maskedSettings(): array
    {
        $settings = $this->settings ?? [];

        return collect($settings)
            ->map(function ($value, $key) {
                if (! is_string($value)) {
                    return $value;
                }

                if ($this->isSensitiveKey($key)) {
                    return $this->maskValue($value);
                }

                return $value;
            })
            ->all();
    }

    /**
     * Determine if a setting key should be treated as sensitive.
     */
    protected function isSensitiveKey(string $key): bool
    {
        $sensitiveIndicators = ['key', 'secret', 'token'];

        $lowerKey = strtolower($key);

        return collect($sensitiveIndicators)
            ->contains(fn ($indicator) => str_contains($lowerKey, $indicator));
    }

    /**
     * Mask a sensitive string value, leaving the last 4 characters visible.
     */
    protected function maskValue(string $value): string
    {
        $length = strlen($value);

        if ($length <= 4) {
            return str_repeat('*', $length);
        }

        return str_repeat('*', max($length - 4, 0)).substr($value, -4);
    }

    /**
     * Return an array payload formatted for frontend usage.
     */
    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'service' => $this->service,
            'display_name' => $this->display_name,
            'is_active' => $this->is_active,
            'status' => $this->status,
            'notes' => $this->notes,
            'last_checked_at' => optional($this->last_checked_at)?->toAtomString(),
            'settings' => $this->maskedSettings(),
        ];
    }
}

