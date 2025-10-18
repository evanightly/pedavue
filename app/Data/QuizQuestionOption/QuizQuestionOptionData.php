<?php

namespace App\Data\QuizQuestionOption;

use App\Data\QuizQuestion\QuizQuestionData;
use App\Models\QuizQuestionOption;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizQuestionOptionData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?int $quiz_question_id,
        public ?string $option_text,
        public ?bool $is_correct,
        public int $order = 0,
        public ?QuizQuestionData $quiz_question = null,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(QuizQuestionOption $model): self {
        return new self(
            id: $model->getKey(),
            quiz_question_id: $model->quiz_question_id,
            option_text: $model->option_text,
            is_correct: $model->is_correct, // TODO: hide from client
            order: $model->order,
            quiz_question: $model->relationLoaded('quiz_question') ? QuizQuestionData::from($model->quiz_question) : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
