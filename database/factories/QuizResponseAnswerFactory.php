<?php

namespace Database\Factories;

use App\Models\QuizQuestion;
use App\Models\QuizQuestionOption;
use App\Models\QuizResponse;
use App\Models\QuizResponseAnswer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizResponseAnswer>
 */
class QuizResponseAnswerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_response_id' => QuizResponse::inRandomOrder()->first()->getKey(),
            'quiz_question_id' => QuizQuestion::inRandomOrder()->first()->getKey(),
            'quiz_question_option_id' => QuizQuestionOption::inRandomOrder()->first()->getKey(),
        ];
    }

    /**
     * Configure the model factory.
     *
     * @return $this
     */
    public function configure()
    {
        return $this->afterCreating(function (QuizResponseAnswer $quizResponseAnswer) {
            $startedAt = rand($quizResponseAnswer->quiz_response->started_at->timestamp, $quizResponseAnswer->quiz_response->finished_at->timestamp);
            $quizQuestion = QuizQuestion::whereQuizId($quizResponseAnswer->quiz_response->quiz_id)
                    ->whereNotIn('id', $quizResponseAnswer->quiz_response->quiz_response_answers->pluck('quiz_question_id')->toArray())
                    ->inRandomOrder()->first() ?? $quizResponseAnswer->quiz_question;
            $quizResponseAnswer->update([
                'quiz_question_id' => $quizQuestion->id,
                'quiz_question_option_id' => QuizQuestionOption::whereQuizQuestionId($quizQuestion->id)->inRandomOrder()->first()->id,
                'started_at' => $startedAt,
                'finished_at' => rand($startedAt, $quizResponseAnswer->quiz_response->finished_at->timestamp),
            ]);
            // TODO: change score of quiz response based on answers
        });
    }
}
