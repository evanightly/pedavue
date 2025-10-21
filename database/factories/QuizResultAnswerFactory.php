<?php

namespace Database\Factories;

use App\Models\Answer;
use App\Models\Question;
use App\Models\QuizResult;
use App\Models\QuizResultAnswer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\QuizResultAnswer>
 */
class QuizResultAnswerFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_answer_text' => fake()->sentence(),
            'started_at' => fake()->dateTime(),
            'finished_at' => fake()->dateTime(),
            'quiz_result_id' => QuizResult::factory(),
            'question_id' => Question::factory(),
            'answer_id' => Answer::factory(),
        ];
    }
}
