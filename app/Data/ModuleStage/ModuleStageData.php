<?php

namespace App\Data\ModuleStage;

use App\Data\ModuleContent\ModuleContentData;
use App\Data\ModuleQuiz\ModuleQuizData;
use App\Data\Module\ModuleData;
use App\Models\ModuleStage;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class ModuleStageData extends Data
{
    public function __construct(
        public int|Optional $id,
        public ?string $module_able,
        public ?int $order,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.Module.ModuleData | null')]
        public ?ModuleData $module,
        #[TypeScriptType('App.Data.ModuleContent.ModuleContentData | null')]
        public ?ModuleContentData $module_content,
        #[TypeScriptType('App.Data.ModuleQuiz.ModuleQuizData | null')]
        public ?ModuleQuizData $module_quiz,
    ) {}


    public static function fromModel(ModuleStage $model): self
    {
        return new self(
            id: $model->getKey(),
            module_able: $model->module_able,
            order: $model->order !== null ? (int) $model->order : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            module: $model->relationLoaded('module') && $model->module
                ? ModuleData::fromModel($model->module)
                : null,
            module_content: $model->relationLoaded('module_content') && $model->module_content
                ? ModuleContentData::fromModel($model->module_content)
                : null,
            module_quiz: $model->relationLoaded('module_quiz') && $model->module_quiz
                ? ModuleQuizData::fromModel($model->module_quiz)
                : null,
        );
    }
}
