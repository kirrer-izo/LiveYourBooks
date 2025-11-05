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
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->unique();
            
            // Habit reminders
            $table->boolean('habit_reminders_enabled')->default(false);
            $table->time('habit_reminder_time')->default('09:00');
            $table->json('habit_reminder_days')->nullable(); // [1,2,3,4,5,6,7] for Mon-Sun
            
            // Journal reminders
            $table->boolean('journal_reminders_enabled')->default(false);
            $table->time('journal_reminder_time')->default('20:00');
            $table->json('journal_reminder_days')->nullable(); // [1,2,3,4,5,6,7] for Mon-Sun
            
            // Task reminders
            $table->boolean('task_reminders_enabled')->default(true);
            $table->time('task_reminder_time')->default('08:00');
            $table->json('task_reminder_days')->nullable(); // [1,2,3,4,5,6,7] for Mon-Sun
            
            // Timezone
            $table->string('timezone')->default('UTC');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
