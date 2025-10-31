<?php

namespace App\Data\VideoScene;

use App\Data\ModuleContent\ModuleContentData;
use App\Data\User\UserData;
use App\Models\VideoScene;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use App\Data\SceneInteraction\SceneInteractionData;

#[TypeScript]
class VideoSceneData extends Data
{
    public function __construct(
        public int|Optional $id,
        public ?int $module_content_id,
        public ?string $visual,
        public ?string $voice_over,
        public ?int $time_chapter,
        public ?int $interaction_trigger_time,
        public ?string $interaction_type,
        public ?array $scene_interactions = null,
        public ?ModuleContentData $module_content = null,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}


    /**
     * Create a new instance of the {@see VideoSceneData} class from a given
     * {@see VideoScene} model.
     *
     * @param VideoScene $model The model to create a new instance from.
     *
     * @return static
     */
    public static function fromModel(VideoScene $model): self
    {
        return new self(
            id: $model->getKey(),
            module_content_id: $model->module_content_id,
            visual: $model->visual,
            voice_over: $model->voice_over,
            time_chapter: $model->time_chapter,
            interaction_trigger_time: $model->interaction_trigger_time,
            interaction_type: $model->interaction_type,
            scene_interactions: $model->relationLoaded('scene_interactions') ? array_map(fn($m) => SceneInteractionData::fromModel($m), $model->scene_interactions->all()) : null,
            module_content: $model->relationLoaded('module_content') ? ModuleContentData::from($model->module_content) : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
