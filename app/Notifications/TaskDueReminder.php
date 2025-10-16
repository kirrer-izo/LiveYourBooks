<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskDueReminder extends Notification implements ShouldQueue
{
    use Queueable;

    protected $tasks;

    public function __construct($tasks)
    {
        $this->tasks = $tasks;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        $taskCount = $this->tasks->count();
        $overdueTasks = $this->tasks->where('due_date', '<', now());
        $todayTasks = $this->tasks->where('due_date', '>=', now()->startOfDay())
                                 ->where('due_date', '<=', now()->endOfDay());
        
        $message = (new MailMessage)
            ->subject('Task Reminder - Action Required');
            
        if ($overdueTasks->count() > 0) {
            $message->line("You have {$overdueTasks->count()} overdue task(s):");
            foreach ($overdueTasks->take(3) as $task) {
                $message->line("• {$task->title} (Due: {$task->due_date->format('M j')})");
            }
        }
        
        if ($todayTasks->count() > 0) {
            $message->line("You have {$todayTasks->count()} task(s) due today:");
            foreach ($todayTasks->take(3) as $task) {
                $message->line("• {$task->title}");
            }
        }
        
        return $message
            ->action('View Tasks', url('/tasks'))
            ->line('Stay on track with your goals!');
    }

    public function toDatabase($notifiable)
    {
        $overdueTasks = $this->tasks->where('due_date', '<', now());
        $todayTasks = $this->tasks->where('due_date', '>=', now()->startOfDay())
                                 ->where('due_date', '<=', now()->endOfDay());
        
        $message = '';
        if ($overdueTasks->count() > 0) {
            $message .= "{$overdueTasks->count()} overdue task(s). ";
        }
        if ($todayTasks->count() > 0) {
            $message .= "{$todayTasks->count()} task(s) due today.";
        }
        
        return [
            'type' => 'task_reminder',
            'message' => trim($message),
            'overdue_count' => $overdueTasks->count(),
            'today_count' => $todayTasks->count(),
            'action_url' => '/tasks',
        ];
    }
}
