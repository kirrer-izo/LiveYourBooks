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
        Schema::create('growth_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('report_type'); // weekly, monthly
            $table->date('period_start');
            $table->date('period_end');
            $table->integer('consistency_score')->default(0);
            $table->json('habit_metrics')->nullable();
            $table->json('task_metrics')->nullable();
            $table->json('streak_analysis')->nullable();
            $table->json('growth_trends')->nullable();
            $table->json('ai_insights')->nullable();
            $table->json('recommendations')->nullable();
            $table->boolean('is_generated')->default(false);
            $table->timestamps();
            
            $table->index(['user_id', 'report_type', 'period_start']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('growth_reports');
    }
};
