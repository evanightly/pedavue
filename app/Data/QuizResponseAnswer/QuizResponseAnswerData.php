<?php

namespace App\Data\QuizResponseAnswer;

use App\Data\QuizQuestion\QuizQuestionData;
use App\Data\QuizQuestionOption\QuizQuestionOptionData;
use App\Data\QuizResponse\QuizResponseData;
use App\Models\QuizResponseAnswer;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizResponseAnswerData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?int $quiz_response_id,
        public ?int $quiz_question_id,
        public ?int $quiz_question_option_id,
        public ?string $started_at,
        public ?string $finished_at,
        public ?QuizResponseData $quiz_response = null,
        public ?QuizQuestionData $quiz_question = null,
        public ?QuizQuestionOptionData $quiz_question_option = null,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(QuizResponseAnswer $model): self {
        return new self(
            id: $model->getKey(),
            quiz_response_id: $model->quiz_response_id,
            quiz_question_id: $model->quiz_question_id,
            quiz_question_option_id: $model->quiz_question_option_id,
            started_at: $model->started_at?->toIso8601String(),
            finished_at: $model->finished_at?->toIso8601String(),
            quiz_response: $model->relationLoaded('quiz_response') ? QuizResponseData::from($model->quiz_response) : null,
            quiz_question: $model->relationLoaded('quiz_question') ? QuizQuestionData::from($model->quiz_question) : null,
            quiz_question_option: $model->relationLoaded('quiz_question_option') ? QuizQuestionOptionData::from($model->quiz_question_option) : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
