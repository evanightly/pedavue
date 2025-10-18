<?php

namespace App\Data\QuizQuestion;

use App\Data\Quiz\QuizData;
use App\Data\QuizQuestionOption\QuizQuestionOptionData;
use App\Models\QuizQuestion;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizQuestionData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?int $quiz_id,
        public ?string $question,
        public bool $is_answer_shuffled = false,
        public int $order = 0,
        public ?QuizData $quiz = null,
        #[DataCollectionOf(QuizQuestionData::class)]
        #[LiteralTypeScriptType('App.Data.QuizQuestionOption.QuizQuestionOptionData[]|null')]
        public ?DataCollection $quiz_question_options,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(QuizQuestion $model): self {
        return new self(
            id: $model->getKey(),
            quiz_id: $model->quiz_id,
            question: $model->question,
            is_answer_shuffled: $model->is_answer_shuffled,
            order: $model->order,
            quiz: $model->relationLoaded('quiz') ? QuizData::from($model->quiz) : null,
            quiz_question_options: $model->relationLoaded('quiz_question_options')
                ? new DataCollection(QuizQuestionOptionData::class, $model->quiz_question_options)
                : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
