<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;

class SendTaskReminders extends Command
{
    protected $signature = 'reminders:tasks';
    protected $description = 'Send task due reminders to users';

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle()
    {
        $this->info('Sending task due reminders...');
        
        $count = $this->notificationService->sendTaskDueReminders();
        
        $this->info("Task reminders sent successfully! ({$count} reminders sent)");
        return 0;
    }
}
