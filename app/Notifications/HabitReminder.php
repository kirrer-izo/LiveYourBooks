<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class HabitReminder extends Notification implements ShouldQueue
{
    use Queueable;

    protected $habits;

    public function __construct($habits)
    {
        $this->habits = $habits;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        $habitCount = $this->habits->count();
        $habitNames = $this->habits->pluck('name')->take(3)->implode(', ');
        
        return (new MailMessage)
            ->subject('Don\'t forget your habits today!')
            ->line("You have {$habitCount} habit(s) to complete today.")
            ->line("Habits: {$habitNames}" . ($habitCount > 3 ? ' and more...' : ''))
            ->action('Check In Now', url('/habits'))
            ->line('Keep up the great work building positive habits!');
    }

    public function toDatabase($notifiable)
    {
        return [
            'type' => 'habit_reminder',
            'message' => "You have {$this->habits->count()} habit(s) to complete today",
            'habits' => $this->habits->pluck('name')->toArray(),
            'action_url' => '/habits',
        ];
    }
}
