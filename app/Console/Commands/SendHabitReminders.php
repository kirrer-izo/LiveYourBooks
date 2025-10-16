<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\NotificationController;

class SendHabitReminders extends Command
{
    protected $signature = 'reminders:habits';
    protected $description = 'Send habit reminders to users who haven\'t completed their habits today';

    public function handle()
    {
        $this->info('Sending habit reminders...');
        
        $controller = new NotificationController();
        $response = $controller->sendHabitReminders();
        
        $this->info('Habit reminders sent successfully!');
        return 0;
    }
}
