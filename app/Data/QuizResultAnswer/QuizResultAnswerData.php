<?php

namespace App\Data\QuizResultAnswer;

use App\Data\Answer\AnswerData;
use App\Data\Question\QuestionData;
use App\Data\QuizResult\QuizResultData;
use App\Models\QuizResultAnswer;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class QuizResultAnswerData extends Data
{
    public function __construct(
        public int|Optional $id,
        public ?string $user_answer_text,
        public ?string $started_at,
        public ?string $finished_at,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.QuizResult.QuizResultData | null')]
        public ?QuizResultData $quiz_result,
        #[TypeScriptType('App.Data.Question.QuestionData | null')]
        public ?QuestionData $question,
        #[TypeScriptType('App.Data.Answer.AnswerData | null')]
        public ?AnswerData $answer,
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
            question: $model->relationLoaded('question') && $model->question
                ? QuestionData::fromModel($model->question)
                : null,
            answer: $model->relationLoaded('answer') && $model->answer
                ? AnswerData::fromModel($model->answer)
                : null,
        );
    }
}
