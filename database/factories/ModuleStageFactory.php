<?php

namespace Database\Factories;

use App\Models\Module;
use App\Models\ModuleContent;
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
            'order' => fake()->numberBetween(1, 1000),
            'module_id' => Module::factory(),
            'module_able_type' => ModuleContent::class,
            'module_able_id' => null,
        ];
    }
}
