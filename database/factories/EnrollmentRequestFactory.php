<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\EnrollmentRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\EnrollmentRequest>
 */
class EnrollmentRequestFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'message' => fake()->sentence(),
            'status' => fake()->word(),
            'user_id' => User::factory(),
            'course_id' => Course::factory(),
        ];
    }
}
