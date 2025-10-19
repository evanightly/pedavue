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
        Schema::create('module_stages', function (Blueprint $table) {
            $table->id();
            $table->string('module_able');
            $table->integer('order');
            $table->foreignId('module_id')->constrained('modules');
            $table->foreignId('module_content_id')->nullable()->constrained('module_contents');
            $table->foreignId('module_quiz_id')->nullable()->constrained('module_quizes');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_stages');
    }
};
