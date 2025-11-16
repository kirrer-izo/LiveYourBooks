<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Habit;

class StreakAchieved extends Notification implements ShouldQueue
{
    use Queueable;

    protected Habit $habit;
    protected int $streak;

    public function __construct(Habit $habit, int $streak)
    {
        $this->habit = $habit;
        $this->streak = $streak;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Streak achieved!')
            ->line("You're on a {$this->streak}-day streak for '{$this->habit->name}'!")
            ->action('Keep it going', url('/habits'));
    }

    public function toDatabase($notifiable)
    {
        return [
            'type' => 'streak_achieved',
            'message' => "You're on a {$this->streak}-day streak for '{$this->habit->name}'!",
            'habit_id' => $this->habit->id,
            'habit_name' => $this->habit->name,
            'streak' => $this->streak,
            'action_url' => '/habits',
        ];
    }
}
