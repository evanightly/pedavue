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
            'certificate_name_box_width' => null,
            'certificate_name_box_height' => null,
            'certificate_name_font_family' => null,
            'certificate_name_font_weight' => null,
            'certificate_name_text_align' => null,
            'certificate_name_text_color' => null,
            'certificate_name_letter_spacing' => null,
            'certificate_qr_position_x' => null,
            'certificate_qr_position_y' => null,
            'certificate_qr_box_width' => null,
            'certificate_qr_box_height' => null,
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
