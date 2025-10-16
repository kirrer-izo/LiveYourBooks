<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Habit;
use App\Models\Task;
use App\Models\Journal;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use App\Notifications\HabitReminder;
use App\Notifications\JournalReminder;
use App\Notifications\TaskDueReminder;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Send habit reminders to users
     */
    public function sendHabitReminders()
    {
        $users = User::whereHas('habits', function ($query) {
            $query->where('is_active', true);
        })->get();
        
        foreach ($users as $user) {
            $incompleteHabits = $user->habits()
                ->where('is_active', true)
                ->get()
                ->filter(function ($habit) {
                    return !$habit->isCompletedToday();
                });
            
            if ($incompleteHabits->count() > 0) {
                $user->notify(new HabitReminder($incompleteHabits));
            }
        }
        
        return response()->json(['message' => 'Habit reminders sent successfully']);
    }
    
    /**
     * Send journal reminders to users who haven't journaled today
     */
    public function sendJournalReminders()
    {
        $users = User::whereDoesntHave('journals', function ($query) {
            $query->whereDate('entry_date', today());
        })->get();
        
        foreach ($users as $user) {
            $user->notify(new JournalReminder());
        }
        
        return response()->json(['message' => 'Journal reminders sent successfully']);
    }
    
    /**
     * Send task due reminders
     */
    public function sendTaskDueReminders()
    {
        $users = User::whereHas('tasks', function ($query) {
            $query->where('is_completed', false)
                  ->whereDate('due_date', '<=', now()->addDay());
        })->get();
        
        foreach ($users as $user) {
            $dueTasks = $user->tasks()
                ->where('is_completed', false)
                ->whereDate('due_date', '<=', now()->addDay())
                ->get();
            
            if ($dueTasks->count() > 0) {
                $user->notify(new TaskDueReminder($dueTasks));
            }
        }
        
        return response()->json(['message' => 'Task due reminders sent successfully']);
    }
    
    /**
     * Get user's notification preferences
     */
    public function getPreferences()
    {
        $user = Auth::user();
        
        return response()->json([
            'preferences' => $user->notification_preferences ?? [
                'habit_reminders' => true,
                'journal_reminders' => true,
                'task_reminders' => true,
                'reminder_time' => '09:00',
            ]
        ]);
    }
    
    /**
     * Update user's notification preferences
     */
    public function updatePreferences(Request $request)
    {
        $request->validate([
            'habit_reminders' => 'boolean',
            'journal_reminders' => 'boolean',
            'task_reminders' => 'boolean',
            'reminder_time' => 'required|date_format:H:i',
        ]);
        
        $user = Auth::user();
        $user->update([
            'notification_preferences' => $request->only([
                'habit_reminders',
                'journal_reminders', 
                'task_reminders',
                'reminder_time'
            ])
        ]);
        
        return response()->json(['message' => 'Notification preferences updated successfully']);
    }
}
