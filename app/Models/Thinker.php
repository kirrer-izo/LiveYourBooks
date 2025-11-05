<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\ThinkerType;

class Thinker extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'name',
        'description',
        'advice_style',
        'is_active',
    ];

    protected $casts = [
        'type' => ThinkerType::class,
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getDisplayName(): string
    {
        return $this->type === ThinkerType::CUSTOM 
            ? $this->name 
            : $this->type->getDisplayName();
    }

    public function getDescription(): string
    {
        return $this->type === ThinkerType::CUSTOM 
            ? $this->description 
            : $this->type->getDescription();
    }

    public function getAdviceStyle(): string
    {
        return $this->type === ThinkerType::CUSTOM 
            ? $this->advice_style 
            : $this->type->getAdviceStyle();
    }

    public function isPredefined(): bool
    {
        return $this->type !== ThinkerType::CUSTOM;
    }

    public function isCustom(): bool
    {
        return $this->type === ThinkerType::CUSTOM;
    }
}
