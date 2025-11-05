<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule notification reminders to run every 15 minutes
// This ensures reminders are sent even if the reminder time doesn't align with the hour
// The NotificationService will check user preferences and send reminders at the right time
Schedule::command('reminders:habits')->everyFifteenMinutes();
Schedule::command('reminders:journal')->everyFifteenMinutes();
Schedule::command('reminders:tasks')->everyFifteenMinutes();
