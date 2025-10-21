<?php

namespace App\Data\Module;

use App\Data\Course\CourseData;
use App\Data\ModuleStage\ModuleStageData;
use App\Models\Module;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class ModuleData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $title,
        public ?string $description,
        public ?string $thumbnail,
        public ?int $duration,
        public ?int $order,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.Course.CourseData | null')]
        public ?CourseData $course,
        #[DataCollectionOf(ModuleStageData::class)]
        #[LiteralTypeScriptType('App.Data.ModuleStage.ModuleStageData[]|null')]
        public ?DataCollection $module_stages,
    ) {}

    public static function fromModel(Module $model): self {
        return new self(
            id: $model->getKey(),
            title: $model->title,
            description: $model->description,
            thumbnail: $model->thumbnail,
            duration: $model->duration !== null ? (int) $model->duration : null,
            order: $model->order !== null ? (int) $model->order : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            course: $model->relationLoaded('course') && $model->course
                ? CourseData::fromModel($model->course)
                : null,
            module_stages: $model->relationLoaded('module_stages')
                ? new DataCollection(ModuleStageData::class, $model->module_stages)
                : null,
        );
    }
}
