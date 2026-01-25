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
        Schema::table('conversations', function (Blueprint $table) {
            // Drop FK on mentor_id if it exists. 
            // Note: SQLite might have trouble dropping FKs without reconstructing table, 
            // but Laravel usually handles it. 
            // If strictly SQLite testing, we might need a different approach, 
            // but for standard migration file:
            $table->dropForeign(['mentor_id']);
            
            // Add thinker_id
            $table->foreignId('thinker_id')->nullable()->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['thinker_id']);
            $table->dropColumn('thinker_id');
            
            // Restore mentor_id FK (assuming mentors table exists)
            $table->foreign('mentor_id')->references('id')->on('mentors')->onDelete('set null');
        });
    }
};
