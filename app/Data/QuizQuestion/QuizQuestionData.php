<?php

namespace App\Data\QuizQuestion;

use App\Data\Quiz\QuizData;
use App\Models\QuizQuestion;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizQuestionData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?int $quiz_id,
        public ?string $question,
        public ?QuizData $quiz = null,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(QuizQuestion $model): self {
        return new self(
            id: $model->getKey(),
            quiz_id: $model->quiz_id,
            question: $model->question,
            quiz: $model->relationLoaded('quiz') ? QuizData::from($model->quiz) : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
