<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;
use App\Models\User;
use Carbon\Carbon;

class TestNotificationTiming extends Command
{
    protected $signature = 'notifications:test-timing {user_id?}';
    protected $description = 'Test notification timing for a user';

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle()
    {
        $userId = $this->argument('user_id') ?? 2;
        $user = User::find($userId);
        
        if (!$user) {
            $this->error("User not found!");
            return 1;
        }

        $prefs = $user->getNotificationPreferences();
        
        $this->info("=== Notification Timing Test for User: {$user->name} ===");
        $this->info("Current time: " . now()->format('Y-m-d H:i:s'));
        $this->info("Timezone: " . $prefs->timezone);
        $this->info("");
        
        // Test habit reminders
        $this->info("--- Habit Reminders ---");
        $this->info("Enabled: " . ($prefs->habit_reminders_enabled ? 'Yes' : 'No'));
        $this->info("Time: " . $prefs->habit_reminder_time);
        $this->info("Days: " . json_encode($prefs->habit_reminder_days ?? []));
        
        if ($prefs->habit_reminders_enabled) {
            $shouldSend = $prefs->shouldSendToday('habit');
            $this->info("Should send today: " . ($shouldSend ? 'Yes' : 'No'));
            
            if ($shouldSend) {
                $reminderTime = $prefs->getReminderTime('habit');
                $now = Carbon::now($prefs->timezone);
                $reminder = Carbon::createFromTimeString($reminderTime, $prefs->timezone);
                $reminder->setDate($now->year, $now->month, $now->day);
                
                $diffInMinutes = abs($now->diffInMinutes($reminder, false));
                $this->info("Time difference: {$diffInMinutes} minutes");
                $this->info("Within window (60 min): " . ($diffInMinutes <= 60 ? 'Yes' : 'No'));
                $this->info("Reminder time: " . $reminder->format('H:i'));
            }
        }
        
        $this->info("");
        
        // Test journal reminders
        $this->info("--- Journal Reminders ---");
        $this->info("Enabled: " . ($prefs->journal_reminders_enabled ? 'Yes' : 'No'));
        $this->info("Time: " . $prefs->journal_reminder_time);
        $this->info("Days: " . json_encode($prefs->journal_reminder_days ?? []));
        
        if ($prefs->journal_reminders_enabled) {
            $shouldSend = $prefs->shouldSendToday('journal');
            $this->info("Should send today: " . ($shouldSend ? 'Yes' : 'No'));
            
            if ($shouldSend) {
                $reminderTime = $prefs->getReminderTime('journal');
                $now = Carbon::now($prefs->timezone);
                $reminder = Carbon::createFromTimeString($reminderTime, $prefs->timezone);
                $reminder->setDate($now->year, $now->month, $now->day);
                
                $diffInMinutes = abs($now->diffInMinutes($reminder, false));
                $this->info("Time difference: {$diffInMinutes} minutes");
                $this->info("Within window (60 min): " . ($diffInMinutes <= 60 ? 'Yes' : 'No'));
                $this->info("Reminder time: " . $reminder->format('H:i'));
            }
        }
        
        $this->info("");
        
        // Test task reminders
        $this->info("--- Task Reminders ---");
        $this->info("Enabled: " . ($prefs->task_reminders_enabled ? 'Yes' : 'No'));
        $this->info("Time: " . $prefs->task_reminder_time);
        $this->info("Days: " . json_encode($prefs->task_reminder_days ?? []));
        
        if ($prefs->task_reminders_enabled) {
            $shouldSend = $prefs->shouldSendToday('task');
            $this->info("Should send today: " . ($shouldSend ? 'Yes' : 'No'));
            
            if ($shouldSend) {
                $reminderTime = $prefs->getReminderTime('task');
                $now = Carbon::now($prefs->timezone);
                $reminder = Carbon::createFromTimeString($reminderTime, $prefs->timezone);
                $reminder->setDate($now->year, $now->month, $now->day);
                
                $diffInMinutes = abs($now->diffInMinutes($reminder, false));
                $this->info("Time difference: {$diffInMinutes} minutes");
                $this->info("Within window (60 min): " . ($diffInMinutes <= 60 ? 'Yes' : 'No'));
                $this->info("Reminder time: " . $reminder->format('H:i'));
            }
        }
        
        $this->info("");
        $this->info("=== Next Steps ===");
        $this->info("1. Make sure scheduler is running: php artisan schedule:work");
        $this->info("2. Make sure queue worker is running: php artisan queue:work");
        $this->info("3. Scheduler runs every 15 minutes");
        $this->info("4. Reminders are sent when current time is within 60 minutes of reminder time");
        
        return 0;
    }
}

