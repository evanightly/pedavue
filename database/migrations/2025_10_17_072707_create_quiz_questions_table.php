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
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->onDelete('cascade');
            $table->text('question');
            $table->boolean('is_answer_shuffled')->default(false);
            $table->integer('order')->nullable();
            $table->timestamps();
        });

        if (app()->isLocal()) {
            Artisan::call('db:seed', ['--class' => 'QuizQuestionSeeder']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};
