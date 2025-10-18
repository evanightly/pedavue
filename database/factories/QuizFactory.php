<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Quiz>
 */
class QuizFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'duration' => round(fake()->numberBetween(30, 120) / 5) * 5,
            'is_question_shuffled' => fake()->boolean(),
            'type' => fake()->randomElement(['pre-test', 'post-test', 'exercise']),
        ];
    }
}
