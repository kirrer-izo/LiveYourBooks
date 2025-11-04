<?php

namespace App\Services;

use App\Models\User;
use App\Models\Habit;
use App\Models\Journal;
use App\Models\Task;
use App\Notifications\HabitReminder;
use App\Notifications\JournalReminder;
use App\Notifications\TaskDueReminder;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class NotificationService
{
    /**
     * Send habit reminders to users based on their preferences
     */
    public function sendHabitReminders(): int
    {
        $sentCount = 0;
        
        // Get users with active habits
        $users = User::whereHas('habits', function ($query) {
            $query->where('is_active', true);
        })->get();
        
        foreach ($users as $user) {
            try {
                $preferences = $user->getNotificationPreferences();
                
                // Check if habit reminders are enabled and should be sent today
                if (!$preferences->shouldSendToday('habit')) {
                    continue;
                }
                
                // Check if it's the right time (within a 1-hour window)
                $reminderTime = $preferences->getReminderTime('habit');
                if (!$this->isWithinTimeWindow($reminderTime, $preferences->timezone)) {
                    continue;
                }
                
                // Get incomplete habits for today
                $incompleteHabits = $user->habits()
                    ->where('is_active', true)
                    ->get()
                    ->filter(function ($habit) {
                        return !$habit->isCompletedToday();
                    });
                
                if ($incompleteHabits->count() > 0) {
                    // Check if we've already sent a reminder today
                    if (!$this->hasSentReminderToday($user, 'habit_reminder')) {
                        $user->notify(new HabitReminder($incompleteHabits));
                        $sentCount++;
                        Log::info('Habit reminder sent', [
                            'user_id' => $user->id,
                            'habits_count' => $incompleteHabits->count(),
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to send habit reminder', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        return $sentCount;
    }
    
    /**
     * Send journal reminders to users who haven't journaled today
     */
    public function sendJournalReminders(): int
    {
        $sentCount = 0;
        
        // Get users who haven't journaled today
        $users = User::whereDoesntHave('journals', function ($query) {
            $query->whereDate('entry_date', today());
        })->get();
        
        foreach ($users as $user) {
            try {
                $preferences = $user->getNotificationPreferences();
                
                // Check if journal reminders are enabled and should be sent today
                if (!$preferences->shouldSendToday('journal')) {
                    continue;
                }
                
                // Check if it's the right time (within a 1-hour window)
                $reminderTime = $preferences->getReminderTime('journal');
                if (!$this->isWithinTimeWindow($reminderTime, $preferences->timezone)) {
                    continue;
                }
                
                // Check if we've already sent a reminder today
                if (!$this->hasSentReminderToday($user, 'journal_reminder')) {
                    $user->notify(new JournalReminder());
                    $sentCount++;
                    Log::info('Journal reminder sent', [
                        'user_id' => $user->id,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send journal reminder', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        return $sentCount;
    }
    
    /**
     * Send task due reminders
     */
    public function sendTaskDueReminders(): int
    {
        $sentCount = 0;
        
        // Get users with due tasks
        $users = User::whereHas('tasks', function ($query) {
            $query->where('is_completed', false)
                  ->whereDate('due_date', '<=', now()->addDay());
        })->get();
        
        foreach ($users as $user) {
            try {
                $preferences = $user->getNotificationPreferences();
                
                // Check if task reminders are enabled and should be sent today
                if (!$preferences->shouldSendToday('task')) {
                    continue;
                }
                
                // Check if it's the right time (within a 1-hour window)
                $reminderTime = $preferences->getReminderTime('task');
                if (!$this->isWithinTimeWindow($reminderTime, $preferences->timezone)) {
                    continue;
                }
                
                $dueTasks = $user->tasks()
                    ->where('is_completed', false)
                    ->whereDate('due_date', '<=', now()->addDay())
                    ->get();
                
                if ($dueTasks->count() > 0) {
                    // Check if we've already sent a reminder today
                    if (!$this->hasSentReminderToday($user, 'task_reminder')) {
                        $user->notify(new TaskDueReminder($dueTasks));
                        $sentCount++;
                        Log::info('Task reminder sent', [
                            'user_id' => $user->id,
                            'tasks_count' => $dueTasks->count(),
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to send task reminder', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        return $sentCount;
    }
    
    /**
     * Check if current time is within the reminder time window (1 hour)
     */
    protected function isWithinTimeWindow(?string $reminderTime, ?string $timezone = null): bool
    {
        if (!$reminderTime) {
            return false;
        }
        
        $now = Carbon::now($timezone);
        $reminder = Carbon::createFromTimeString($reminderTime, $timezone);
        
        // Set today's date for the reminder time
        $reminder->setDate($now->year, $now->month, $now->day);
        
        // Check if we're within 1 hour of the reminder time
        $diffInMinutes = abs($now->diffInMinutes($reminder, false));
        
        return $diffInMinutes <= 60; // 1 hour window
    }
    
    /**
     * Check if we've already sent a reminder today
     */
    protected function hasSentReminderToday(User $user, string $type): bool
    {
        // Map type to notification class names
        $notificationClasses = [
            'habit_reminder' => 'App\\Notifications\\HabitReminder',
            'journal_reminder' => 'App\\Notifications\\JournalReminder',
            'task_reminder' => 'App\\Notifications\\TaskDueReminder',
        ];
        
        $notificationClass = $notificationClasses[$type] ?? null;
        
        if (!$notificationClass) {
            return false;
        }
        
        return $user->notifications()
            ->where('type', $notificationClass)
            ->whereDate('created_at', today())
            ->exists();
    }
}

