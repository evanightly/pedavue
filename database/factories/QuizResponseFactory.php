<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizResponse;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizResponse>
 */
class QuizResponseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::inRandomOrder()->first()->getKey(),
            'user_id' => User::inRandomOrder()->first()->getKey(),
            'attempt' => fake()->numberBetween(1, 3),
            'score' => fake()->numberBetween(0, 100),
        ];
    }

    /**
     * Configure the model factory.
     *
     * @return $this
     */
    public function configure()
    {
        return $this->afterCreating(function (QuizResponse $quizResponse) {
            $startedAt = $quizResponse->created_at->addSeconds(rand(1, 3));
            $quizResponse->update([
                'started_at' => $startedAt,
                'finished_at' => $startedAt->copy()->addSeconds($quizResponse->quiz->duration ? $quizResponse->quiz->duration * 60 : rand(1800, 18000)),
            ]);
        });
    }
}
