<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule notification reminders to run hourly
// The NotificationService will check user preferences and send reminders at the right time
Schedule::command('reminders:habits')->hourly();
Schedule::command('reminders:journal')->hourly();
Schedule::command('reminders:tasks')->hourly();
