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
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            // $table->foreignId('module_id')->constrained();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('duration')->nullable();
            $table->boolean('is_question_shuffled')->default(false);
            $table->enum('type', ['pre-test', 'post-test', 'exercise'])->default('exercise');
            $table->timestamps();
        });
        if (app()->isLocal()) {
            Artisan::call('db:seed', ['--class' => 'QuizSeeder']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};
