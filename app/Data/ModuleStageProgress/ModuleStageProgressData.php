<?php

namespace App\Data\ModuleStageProgress;

use App\Data\Enrollment\EnrollmentData;
use App\Data\ModuleStage\ModuleStageData;
use App\Models\ModuleStageProgress;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class ModuleStageProgressData extends Data {
    /**
     * @param  array<string, mixed>  $state
     */
    public function __construct(
        public int|Optional $id,
        public ?string $status,
        public ?string $started_at,
        public ?string $completed_at,
        public array $state,
        #[TypeScriptType('App.Data.ModuleStage.ModuleStageData | null')]
        public ?ModuleStageData $module_stage,
        #[TypeScriptType('App.Data.Enrollment.EnrollmentData | null')]
        public ?EnrollmentData $enrollment,
        public ?string $updated_at,
    ) {}

    public static function fromModel(ModuleStageProgress $model): self {
        return new self(
            id: $model->getKey(),
            status: $model->status,
            started_at: $model->started_at?->toIso8601String(),
            completed_at: $model->completed_at?->toIso8601String(),
            state: is_array($model->state) ? $model->state : [],
            module_stage: $model->relationLoaded('module_stage') && $model->module_stage
                ? ModuleStageData::fromModel($model->module_stage)
                : null,
            enrollment: $model->relationLoaded('enrollment') && $model->enrollment
                ? EnrollmentData::fromModel($model->enrollment)
                : null,
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
