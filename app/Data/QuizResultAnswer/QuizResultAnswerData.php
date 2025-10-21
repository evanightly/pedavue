<?php

namespace App\Data\QuizResultAnswer;

use App\Data\QuizQuestion\QuizQuestionData;
use App\Data\QuizQuestionOption\QuizQuestionOptionData;
use App\Data\QuizResult\QuizResultData;
use App\Models\QuizResultAnswer;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizResultAnswerData extends Data
{
    public function __construct(
        public int|Optional $id,
        public ?string $user_answer_text,
        public ?int $quiz_result_id,
        public ?int $quiz_question_id,
        public ?int $quiz_question_option_id,
        public ?string $started_at,
        public ?string $finished_at,
        public ?QuizResultData $quiz_result = null,
        public ?QuizQuestionData $quiz_question = null,
        public ?QuizQuestionOptionData $quiz_question_option = null,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}


    public static function fromModel(QuizResultAnswer $model): self
    {
        return new self(
            id: $model->getKey(),
            user_answer_text: $model->user_answer_text,
            started_at: $model->started_at?->toIso8601String(),
            finished_at: $model->finished_at?->toIso8601String(),
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            quiz_result: $model->relationLoaded('quiz_result') && $model->quiz_result
                ? QuizResultData::fromModel($model->quiz_result)
                : null,
            quiz_question: $model->relationLoaded('quiz_question') && $model->quiz_question
                ? QuizQuestionData::fromModel($model->quiz_question)
                : null,
            quiz_question_option: $model->relationLoaded('quiz_question_option') && $model->quiz_question_option
                ? QuizQuestionOptionData::fromModel($model->quiz_question_option)
                : null,
        );
    }
}
