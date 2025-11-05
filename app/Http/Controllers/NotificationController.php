<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Send habit reminders to users
     */
    public function sendHabitReminders()
    {
        try {
            $count = $this->notificationService->sendHabitReminders();
            return response()->json([
                'message' => 'Habit reminders sent successfully',
                'sent_count' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send habit reminders', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to send habit reminders'], 500);
        }
    }
    
    /**
     * Send journal reminders to users who haven't journaled today
     */
    public function sendJournalReminders()
    {
        try {
            $count = $this->notificationService->sendJournalReminders();
            return response()->json([
                'message' => 'Journal reminders sent successfully',
                'sent_count' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send journal reminders', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to send journal reminders'], 500);
        }
    }
    
    /**
     * Send task due reminders
     */
    public function sendTaskDueReminders()
    {
        try {
            $count = $this->notificationService->sendTaskDueReminders();
            return response()->json([
                'message' => 'Task due reminders sent successfully',
                'sent_count' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send task reminders', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to send task reminders'], 500);
        }
    }
    
    /**
     * Get user's notification preferences
     */
    public function getPreferences()
    {
        $user = Auth::user();
        $preferences = $user->getNotificationPreferences();
        
        return response()->json([
            'preferences' => [
                'habit_reminders_enabled' => $preferences->habit_reminders_enabled,
                'habit_reminder_time' => $preferences->habit_reminder_time,
                'habit_reminder_days' => $preferences->habit_reminder_days ?? [1, 2, 3, 4, 5, 6, 7],
                'journal_reminders_enabled' => $preferences->journal_reminders_enabled,
                'journal_reminder_time' => $preferences->journal_reminder_time,
                'journal_reminder_days' => $preferences->journal_reminder_days ?? [1, 2, 3, 4, 5, 6, 7],
                'task_reminders_enabled' => $preferences->task_reminders_enabled,
                'task_reminder_time' => $preferences->task_reminder_time,
                'task_reminder_days' => $preferences->task_reminder_days ?? [1, 2, 3, 4, 5, 6, 7],
                'timezone' => $preferences->timezone,
            ]
        ]);
    }
    
    /**
     * Update user's notification preferences
     */
    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'habit_reminders_enabled' => 'boolean',
            'habit_reminder_time' => 'required_with:habit_reminders_enabled|date_format:H:i',
            'habit_reminder_days' => 'array',
            'habit_reminder_days.*' => 'integer|min:1|max:7',
            'journal_reminders_enabled' => 'boolean',
            'journal_reminder_time' => 'required_with:journal_reminders_enabled|date_format:H:i',
            'journal_reminder_days' => 'array',
            'journal_reminder_days.*' => 'integer|min:1|max:7',
            'task_reminders_enabled' => 'boolean',
            'task_reminder_time' => 'required_with:task_reminders_enabled|date_format:H:i',
            'task_reminder_days' => 'array',
            'task_reminder_days.*' => 'integer|min:1|max:7',
            'timezone' => 'string|max:255',
        ]);
        
        $user = Auth::user();
        $preferences = $user->getNotificationPreferences();
        
        // Update preferences
        $preferences->update($validated);
        
        return redirect()->route('notifications.edit')
            ->with('success', 'Notification preferences updated successfully!');
    }
    
    /**
     * Get user's notifications
     */
    public function getNotifications(Request $request)
    {
        $user = Auth::user();
        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));
        
        return response()->json($notifications);
    }
    
    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        $notification = $user->notifications()->findOrFail($id);
        $notification->markAsRead();
        
        return response()->json(['message' => 'Notification marked as read']);
    }
    
    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        $user = Auth::user();
        $user->unreadNotifications->markAsRead();
        
        return response()->json(['message' => 'All notifications marked as read']);
    }
}
