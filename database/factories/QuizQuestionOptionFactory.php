<?php

namespace Database\Factories;

use App\Models\QuizQuestion;
use App\Models\QuizQuestionOption;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizQuestionOption>
 */
class QuizQuestionOptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_question_id' => QuizQuestion::inRandomOrder()->first()->getKey(),
            'option_text' => fake()->sentence(),
            'is_correct' => fake()->boolean(),
        ];
    }

    public function configure(): static {
        return $this->afterCreating(function (QuizQuestionOption $quiz_question_option) {
            $quiz_question_option->update([
                'order' => QuizQuestionOption::whereQuizQuestionId($quiz_question_option->quiz_question_id)->max('order') + 1
            ]);
        });
    }
}
