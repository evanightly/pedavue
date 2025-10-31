<?php

namespace App\Data\SceneInteraction;

use App\Models\SceneInteraction;
use App\Data\Quiz\QuizData;
use App\Data\QuizQuestion\QuizQuestionData;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DataCollectionCast;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class SceneInteractionData extends Data
{
    public function __construct(
        public int|null $id,
        public int $video_scene_id,
        public ?string $interactable_type,
        public ?int $interactable_id,
        // If the polymorphic interactable is a model we convert it to a Data array here.
        public ?array $interactable_data,
        public ?array $payload,
        public ?int $position,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(SceneInteraction $model): self
    {
        // Base values
        $payload = $model->payload;
        $interactable_data = null;

        // If the polymorphic relation is loaded and points to a Quiz or QuizQuestion,
        // set `interactable_data` to the Data array of that model. Keep `payload`
        // unchanged for backward compatibility.
        $interactable = $model->getRelationValue('interactable');

        if ($interactable instanceof \App\Models\Quiz) {
            $interactable_data = QuizData::from($interactable->load('quiz_questions.quiz_question_options'))->toArray();
        } elseif ($interactable instanceof \App\Models\QuizQuestion) {
            $interactable_data = QuizQuestionData::from($interactable->load('quiz_question_options'))->toArray();
        }

        return new self(
            id: $model->getKey(),
            video_scene_id: $model->video_scene_id,
            interactable_type: $model->interactable_type,
            interactable_id: $model->interactable_id,
            interactable_data: $interactable_data,
            payload: $payload,
            position: $model->position,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
