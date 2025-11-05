<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JournalReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Time for reflection - Journal today!')
            ->line('You haven\'t journaled today yet.')
            ->line('Take a few minutes to reflect on your day, thoughts, and progress.')
            ->action('Start Journaling', url('/journals/create'))
            ->line('Regular reflection helps you grow and stay mindful of your journey.');
    }

    public function toDatabase($notifiable)
    {
        return [
            'type' => 'journal_reminder',
            'message' => 'Time for reflection - Journal today!',
            'action_url' => '/journals/create',
        ];
    }
}
