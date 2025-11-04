<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table) {
            // Add user_id if it doesn't exist
            if (!Schema::hasColumn('notification_preferences', 'user_id')) {
                $table->foreignId('user_id')->after('id')->constrained()->onDelete('cascade')->unique();
            }
            
            // Habit reminders
            if (!Schema::hasColumn('notification_preferences', 'habit_reminders_enabled')) {
                $table->boolean('habit_reminders_enabled')->default(false)->after('user_id');
            }
            if (!Schema::hasColumn('notification_preferences', 'habit_reminder_time')) {
                $table->time('habit_reminder_time')->default('09:00')->after('habit_reminders_enabled');
            }
            if (!Schema::hasColumn('notification_preferences', 'habit_reminder_days')) {
                $table->json('habit_reminder_days')->nullable()->after('habit_reminder_time');
            }
            
            // Journal reminders
            if (!Schema::hasColumn('notification_preferences', 'journal_reminders_enabled')) {
                $table->boolean('journal_reminders_enabled')->default(false)->after('habit_reminder_days');
            }
            if (!Schema::hasColumn('notification_preferences', 'journal_reminder_time')) {
                $table->time('journal_reminder_time')->default('20:00')->after('journal_reminders_enabled');
            }
            if (!Schema::hasColumn('notification_preferences', 'journal_reminder_days')) {
                $table->json('journal_reminder_days')->nullable()->after('journal_reminder_time');
            }
            
            // Task reminders
            if (!Schema::hasColumn('notification_preferences', 'task_reminders_enabled')) {
                $table->boolean('task_reminders_enabled')->default(true)->after('journal_reminder_days');
            }
            if (!Schema::hasColumn('notification_preferences', 'task_reminder_time')) {
                $table->time('task_reminder_time')->default('08:00')->after('task_reminders_enabled');
            }
            if (!Schema::hasColumn('notification_preferences', 'task_reminder_days')) {
                $table->json('task_reminder_days')->nullable()->after('task_reminder_time');
            }
            
            // Timezone
            if (!Schema::hasColumn('notification_preferences', 'timezone')) {
                $table->string('timezone')->default('UTC')->after('task_reminder_days');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'user_id',
                'habit_reminders_enabled',
                'habit_reminder_time',
                'habit_reminder_days',
                'journal_reminders_enabled',
                'journal_reminder_time',
                'journal_reminder_days',
                'task_reminders_enabled',
                'task_reminder_time',
                'task_reminder_days',
                'timezone',
            ]);
        });
    }
};
