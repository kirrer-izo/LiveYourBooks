<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Habit extends Model
{
    /** @use HasFactory<\Database\Factories\HabitFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'streak',
        'target',
        'frequency',
        'last_completed',
        'is_active',
        'task_id',
        'book_id',
    ];

    protected $casts = [
        'last_completed' => 'date',
        'is_active' => 'boolean',
        'streak' => 'integer',
        'target' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsToMany
    {
        return $this->belongsToMany(Task::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function completions(): HasMany
    {
        return $this->hasMany(HabitCompletion::class);
    }

    /**
     * Check if habit was completed today
     */
    public function isCompletedToday(): bool
    {
        return $this->last_completed && $this->last_completed->isToday();
    }

    /**
     * Mark habit as completed for today
     */
    public function markCompleted(): void
    {
        $today = now()->toDateString();
        $lastCompleted = $this->last_completed?->toDateString();
        
        if ($lastCompleted === $today) {
            return; // Already completed today
        }
        
        // Check if we're continuing a streak or starting fresh
        if ($lastCompleted === now()->subDay()->toDateString()) {
            // Continuing streak
            $this->increment('streak');
        } else {
            // Starting new streak
            $this->streak = 1;
        }
        
        $this->last_completed = now();
        $this->save();
    }

    /**
     * Get the current streak status
     */
    public function getStreakStatus(): array
    {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        $lastCompleted = $this->last_completed?->toDateString();
        
        if ($lastCompleted === $today) {
            return ['status' => 'completed', 'streak' => $this->streak];
        } elseif ($lastCompleted === $yesterday) {
            return ['status' => 'pending', 'streak' => $this->streak];
        } else {
            return ['status' => 'broken', 'streak' => 0];
        }
    }

}
