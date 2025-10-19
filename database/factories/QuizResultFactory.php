<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizResult;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\QuizResult>
 */
class QuizResultFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'score' => fake()->numberBetween(1, 1000),
            'attempt' => fake()->numberBetween(1, 1000),
            'started_at' => fake()->dateTime(),
            'finished_at' => fake()->dateTime(),
            'user_id' => User::factory(),
            'quiz_id' => Quiz::factory(),
        ];
    }
}
