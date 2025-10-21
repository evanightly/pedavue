<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Module>
 */
class ModuleFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->word(),
            'description' => fake()->sentence(),
            'thumbnail' => fake()->word(),
            'duration' => fake()->numberBetween(1, 1000),
            'order' => fake()->numberBetween(1, 1000),
            'course_id' => Course::factory(),
        ];
    }
}
