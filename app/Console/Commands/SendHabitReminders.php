<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;

class SendHabitReminders extends Command
{
    protected $signature = 'reminders:habits';
    protected $description = 'Send habit reminders to users who haven\'t completed their habits today';

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle()
    {
        $this->info('Sending habit reminders...');
        
        $count = $this->notificationService->sendHabitReminders();
        
        $this->info("Habit reminders sent successfully! ({$count} reminders sent)");
        return 0;
    }
}
