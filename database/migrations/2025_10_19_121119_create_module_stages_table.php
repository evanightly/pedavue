<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('module_stages', function (Blueprint $table) {
            $table->id();
            $table->string('module_able');
            $table->unsignedInteger('order')->default(1);
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->foreignId('module_content_id')->nullable()->constrained('module_contents')->nullOnDelete();
            $table->foreignId('module_quiz_id')->nullable()->constrained('quizzes')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('module_contents', function (Blueprint $table) {
            $table
                ->foreign('module_stage_id')
                ->references('id')
                ->on('module_stages')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('module_contents', function (Blueprint $table) {
            $table->dropForeign(['module_stage_id']);
        });

        Schema::dropIfExists('module_stages');
    }
};
