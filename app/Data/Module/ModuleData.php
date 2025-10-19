<?php

namespace App\Data\Module;

use App\Data\Course\CourseData;
use App\Models\Module;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class ModuleData extends Data
{
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
    ) {}


    public static function fromModel(Module $model): self
    {
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
        );
    }
}
