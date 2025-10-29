<?php

namespace App\Data\ModuleStage;

use App\Data\Module\ModuleData;
use App\Data\ModuleContent\ModuleContentData;
use App\Data\Quiz\QuizData;
use App\Models\ModuleContent;
use App\Models\ModuleStage;
use App\Models\Quiz;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class ModuleStageData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?int $module_id,
        public ?string $module_able,
        public ?string $module_able_type,
        public ?int $module_able_id,
        public ?int $order,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.Module.ModuleData | null')]
        public ?ModuleData $module,
        #[TypeScriptType('App.Data.ModuleContent.ModuleContentData | null')]
        public ?ModuleContentData $module_content,
        #[TypeScriptType('App.Data.Quiz.QuizData | null')]
        public ?QuizData $module_quiz,
    ) {}

    public static function fromModel(ModuleStage $model): self {
        $moduleAble = $model->getRelationValue('moduleAble');

        $moduleContent = $moduleAble instanceof ModuleContent ? $moduleAble : null;
        $moduleQuiz = $moduleAble instanceof Quiz ? $moduleAble : null;

        return new self(
            id: $model->getKey(),
            module_id: $model->module_id !== null ? (int) $model->module_id : null,
            module_able: $model->module_able,
            module_able_type: $model->module_able_type,
            module_able_id: $model->module_able_id !== null ? (int) $model->module_able_id : null,
            order: $model->order !== null ? (int) $model->order : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            module: $model->relationLoaded('module') && $model->module
                ? ModuleData::fromModel($model->module)
                : null,
            module_content: $moduleContent
                ? ModuleContentData::fromModel($moduleContent)
                : null,
            module_quiz: $moduleQuiz
                ? QuizData::fromModel($moduleQuiz)
                : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function forModel(): array {
        $attributes = [
            'module_id' => $this->module_id,
            'module_able_type' => $this->module_able_type ?? ModuleStage::moduleAbleTypeForKey($this->module_able),
            'module_able_id' => $this->module_able_id,
            'order' => $this->order,
        ];

        $filtered = [];

        foreach ($attributes as $key => $value) {
            if ($value === null && $key !== 'module_able_id') {
                continue;
            }

            $filtered[$key] = $value;
        }

        return $filtered;
    }
}
