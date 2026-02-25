<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add composite indexes on columns that are frequently filtered together,
     * replacing repeated full-table-scans with fast index lookups.
     */
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->index(['user_id', 'is_completed'], 'books_user_completed_idx');
            $table->index(['user_id', 'updated_at'], 'books_user_updated_idx');
            $table->index(['user_id', 'genre'], 'books_user_genre_idx');
        });

        Schema::table('habits', function (Blueprint $table) {
            $table->index(['user_id', 'is_active'], 'habits_user_active_idx');
            $table->index(['user_id', 'last_completed'], 'habits_user_last_completed_idx');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->index(['user_id', 'is_completed'], 'tasks_user_completed_idx');
            $table->index(['user_id', 'updated_at'], 'tasks_user_updated_idx');
            $table->index(['user_id', 'due_date'], 'tasks_user_due_date_idx');
        });

        Schema::table('journals', function (Blueprint $table) {
            $table->index(['user_id', 'entry_date'], 'journals_user_entry_date_idx');
        });

        Schema::table('habit_completions', function (Blueprint $table) {
            $table->index(['habit_id', 'completed_at'], 'habit_completions_habit_date_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex('books_user_completed_idx');
            $table->dropIndex('books_user_updated_idx');
            $table->dropIndex('books_user_genre_idx');
        });

        Schema::table('habits', function (Blueprint $table) {
            $table->dropIndex('habits_user_active_idx');
            $table->dropIndex('habits_user_last_completed_idx');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('tasks_user_completed_idx');
            $table->dropIndex('tasks_user_updated_idx');
            $table->dropIndex('tasks_user_due_date_idx');
        });

        Schema::table('journals', function (Blueprint $table) {
            $table->dropIndex('journals_user_entry_date_idx');
        });

        Schema::table('habit_completions', function (Blueprint $table) {
            $table->dropIndex('habit_completions_habit_date_idx');
        });
    }
};
