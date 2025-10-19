<?php

namespace Database\Factories;

use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\ModuleStage>
 */
class ModuleStageFactory extends Factory {
    /**
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            'module_able' => 'content',
            'order' => fake()->numberBetween(1, 1000),
            'module_id' => Module::factory(),
            'module_content_id' => null,
            'module_quiz_id' => null,
        ];
    }
}
