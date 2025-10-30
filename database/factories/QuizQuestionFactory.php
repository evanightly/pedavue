<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizQuestion>
 */
class QuizQuestionFactory extends Factory {
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            'quiz_id' => Quiz::inRandomOrder()->first()->getKey(),
            'question' => fake()->sentence(),
            'is_answer_shuffled' => fake()->boolean(),
            'points' => 10,
        ];
    }

    public function configure(): static {
        return $this->afterCreating(function (QuizQuestion $quiz_question): void {
            $quiz_question->update([
                'order' => QuizQuestion::whereQuizId($quiz_question->quiz_id)->max('order') + 1,
            ]);
        });
    }
}
