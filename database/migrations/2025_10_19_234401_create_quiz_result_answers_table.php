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
        Schema::create('quiz_result_answers', function (Blueprint $table) {
            $table->id();
            $table->text('user_answer_text')->nullable();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('finished_at')->nullable();
            $table->foreignId('quiz_result_id')->constrained('quiz_results');
            $table->foreignId('question_id')->constrained('quiz_questions');
            $table->foreignId('answer_id')->nullable()->constrained('quiz_question_options');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_result_answers');
    }
};
