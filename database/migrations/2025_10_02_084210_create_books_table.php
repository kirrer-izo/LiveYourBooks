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
        Schema::create('books', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('author')->nullable();
            $table->string('genre')->nullable();
            $table->string('life_area')->nullable();
            $table->string('cover_img')->nullable();

            $table->integer('progress')->default(0);
            $table->boolean('is_completed')->default(false);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table){
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id']);

        });
        Schema::dropIfExists('books');
    }
};
