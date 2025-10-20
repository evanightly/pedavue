<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\ModuleStage;
use App\Support\Enums\ModuleStageProgressStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ModuleStageProgress>
 */
class ModuleStageProgressFactory extends Factory {
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            'enrollment_id' => Enrollment::factory(),
            'module_stage_id' => ModuleStage::factory(),
            'quiz_result_id' => null,
            'status' => ModuleStageProgressStatus::Pending->value,
            'started_at' => null,
            'completed_at' => null,
            'state' => [],
        ];
    }
}
