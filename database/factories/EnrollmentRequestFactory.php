<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\User;
use App\Support\Enums\EnrollmentRequestEnum;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\EnrollmentRequest>
 */
class EnrollmentRequestFactory extends Factory {
    /**
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            'message' => fake()->sentence(),
            'status' => fake()->randomElement([
                EnrollmentRequestEnum::Pending,
                EnrollmentRequestEnum::Approved,
                EnrollmentRequestEnum::Rejected,
            ]),
            'user_id' => User::factory(),
            'course_id' => Course::factory(),
        ];
    }
}
