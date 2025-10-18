<?php

namespace Database\Factories;

use App\Models\Course;
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
            'certificate_name_position_x' => null,
            'certificate_name_position_y' => null,
            'certificate_name_max_length' => null,
        ];
    }

    public function configure(): static {
        return $this->afterCreating(function (Course $course): void {
            if ($course->course_instructors()->exists()) {
                return;
            }

            $course->course_instructors()->attach(User::factory()->create());
        });
    }
}
