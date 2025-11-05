<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;

class SendJournalReminders extends Command
{
    protected $signature = 'reminders:journal';
    protected $description = 'Send journal reminders to users who haven\'t journaled today';

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle()
    {
        $this->info('Sending journal reminders...');
        
        $count = $this->notificationService->sendJournalReminders();
        
        $this->info("Journal reminders sent successfully! ({$count} reminders sent)");
        return 0;
    }
}
