<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\NotificationController;

class SendTaskReminders extends Command
{
    protected $signature = 'reminders:tasks';
    protected $description = 'Send task due reminders to users';

    public function handle()
    {
        $this->info('Sending task due reminders...');
        
        $controller = new NotificationController();
        $response = $controller->sendTaskDueReminders();
        
        $this->info('Task reminders sent successfully!');
        return 0;
    }
}
