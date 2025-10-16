<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\NotificationController;

class SendJournalReminders extends Command
{
    protected $signature = 'reminders:journal';
    protected $description = 'Send journal reminders to users who haven\'t journaled today';

    public function handle()
    {
        $this->info('Sending journal reminders...');
        
        $controller = new NotificationController();
        $response = $controller->sendJournalReminders();
        
        $this->info('Journal reminders sent successfully!');
        return 0;
    }
}
