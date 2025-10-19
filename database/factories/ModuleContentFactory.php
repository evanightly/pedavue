<?php

namespace Database\Factories;

use App\Models\ModuleContent;
use App\Models\ModuleStage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\ModuleContent>
 */
class ModuleContentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->word(),
            'description' => fake()->sentence(),
            'file_path' => fake()->word(),
            'content_url' => fake()->sentence(),
            'duration' => fake()->numberBetween(1, 1000),
            'content_type' => fake()->word(),
            'module_stage_id' => ModuleStage::factory(),
        ];
    }
}
