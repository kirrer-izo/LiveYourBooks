<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'habit_reminders_enabled',
        'habit_reminder_time',
        'habit_reminder_days',
        'journal_reminders_enabled',
        'journal_reminder_time',
        'journal_reminder_days',
        'task_reminders_enabled',
        'task_reminder_time',
        'task_reminder_days',
        'timezone',
    ];

    protected $casts = [
        'habit_reminders_enabled' => 'boolean',
        'journal_reminders_enabled' => 'boolean',
        'task_reminders_enabled' => 'boolean',
        'habit_reminder_days' => 'array',
        'journal_reminder_days' => 'array',
        'task_reminder_days' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get default notification preferences
     */
    public static function getDefaults(): array
    {
        return [
            'habit_reminders_enabled' => false,
            'habit_reminder_time' => '09:00',
            'habit_reminder_days' => [1, 2, 3, 4, 5, 6, 7], // All days
            'journal_reminders_enabled' => false,
            'journal_reminder_time' => '20:00',
            'journal_reminder_days' => [1, 2, 3, 4, 5, 6, 7], // All days
            'task_reminders_enabled' => true,
            'task_reminder_time' => '08:00',
            'task_reminder_days' => [1, 2, 3, 4, 5, 6, 7], // All days
            'timezone' => 'UTC',
        ];
    }

    /**
     * Check if reminder should be sent today based on days setting
     */
    public function shouldSendToday(string $type): bool
    {
        $daysField = "{$type}_reminder_days";
        $enabledField = "{$type}_reminders_enabled";
        
        if (!$this->$enabledField) {
            return false;
        }
        
        // Use user's timezone (fallback to app timezone) to determine local day-of-week
        $timezone = $this->timezone ?: config('app.timezone');
        $currentDay = now($timezone)->dayOfWeekIso; // 1-7 (Monday-Sunday)
        $days = $this->$daysField ?? [];
        
        return in_array($currentDay, $days);
    }

    /**
     * Get reminder time for a specific type
     */
    public function getReminderTime(string $type): ?string
    {
        $timeField = "{$type}_reminder_time";
        return $this->$timeField ?? null;
    }
}
