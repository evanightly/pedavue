<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\CourseInstructor>
 */
class CourseInstructorFactory extends Factory {
    /**
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            'instructor_id' => User::factory(),
            'course_id' => Course::factory(),
        ];
    }
}
