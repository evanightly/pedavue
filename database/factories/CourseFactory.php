<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Course>
 */
class CourseFactory extends Factory {
    use WithoutModelEvents;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            'title' => fake()->word(),
            'slug' => fake()->sentence(),
            'description' => fake()->sentence(),
            'certification_enabled' => fake()->boolean(),
            'thumbnail' => fake()->word(),
            'level' => fake()->word(),
            'duration' => fake()->word(),
            'instructor_id' => User::factory(),
        ];
    }
}
