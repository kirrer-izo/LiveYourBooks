<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/notifications', function (Request $request) {
        $user = $request->user();
        $preferences = $user->getNotificationPreferences();
        
        return Inertia::render('settings/notifications', [
            'preferences' => [
                'habit_reminders_enabled' => $preferences->habit_reminders_enabled,
                'habit_reminder_time' => $preferences->habit_reminder_time,
                'habit_reminder_days' => $preferences->habit_reminder_days ?? [1, 2, 3, 4, 5, 6, 7],
                'journal_reminders_enabled' => $preferences->journal_reminders_enabled,
                'journal_reminder_time' => $preferences->journal_reminder_time,
                'journal_reminder_days' => $preferences->journal_reminder_days ?? [1, 2, 3, 4, 5, 6, 7],
                'task_reminders_enabled' => $preferences->task_reminders_enabled,
                'task_reminder_time' => $preferences->task_reminder_time,
                'task_reminder_days' => $preferences->task_reminder_days ?? [1, 2, 3, 4, 5, 6, 7],
                'timezone' => $preferences->timezone,
            ],
        ]);
    })->name('notifications.edit');

    Route::post('settings/notifications', [\App\Http\Controllers\NotificationController::class, 'updatePreferences'])->name('notifications.update');
});
