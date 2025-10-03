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
   
            Schema::create('tasks', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->boolean('is_completed')->default(false);
    
                $table->foreignId('user_id')->constrained()->onDelete('cascade');;
                $table->foreignId('book_id')->nullable()->constrained()->onDelete('cascade');
                $table->foreignId('habit_id')->nullable()->constrained()->onDelete('cascade');
    
                $table->date('due_date')->nullable();
                $table->string('priority');
                $table->timestamps();
            });
            
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table){
            $table->dropForeign(['user_id']);
            $table->dropForeign(['book_id']);
            $table->dropForeign(['habit_id']);
            $table->dropColumn(['user_id','book_id','habit_id']);

        });
        Schema::dropIfExists('tasks');
    }
};
