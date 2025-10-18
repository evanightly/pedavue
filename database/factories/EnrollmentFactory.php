<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Enrollment>
 */
class EnrollmentFactory extends Factory {
    /**
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            'progress' => fake()->numberBetween(1, 1000),
            'completed_at' => fake()->dateTime(),
            'user_id' => User::factory(),
            'course_id' => Course::factory(),
        ];
    }
}
