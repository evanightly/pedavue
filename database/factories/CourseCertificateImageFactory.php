<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\CourseCertificateImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseCertificateImage>
 */
class CourseCertificateImageFactory extends Factory {
    protected $model = CourseCertificateImage::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            'course_id' => Course::factory(),
            'file_path' => 'courses/certificates/overlays/' . fake()->uuid() . '.png',
            'position_x' => fake()->numberBetween(10, 90),
            'position_y' => fake()->numberBetween(10, 90),
            'width' => fake()->numberBetween(10, 40),
            'height' => fake()->numberBetween(10, 40),
            'z_index' => fake()->numberBetween(0, 10),
            'label' => fake()->word(),
        ];
    }
}
