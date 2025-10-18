<?php

namespace App\Data\QuizResponse;

use App\Data\Quiz\QuizData;
use App\Data\QuizResponseAnswer\QuizResponseAnswerData;
use App\Data\User\UserData;
use App\Models\QuizResponse;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizResponseData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?int $quiz_id,
        public ?int $user_id,
        public ?int $attempt,
        public ?int $score,
        public ?string $started_at,
        public ?string $finished_at,
        public ?QuizData $quiz = null,
        public ?UserData $user = null,
        #[DataCollectionOf(QuizResponseAnswerData::class)]
        #[LiteralTypeScriptType('App.Data.QuizResponseAnswer.QuizResponseAnswerData[]|null')]
        public ?DataCollection $quiz_response_answers,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(QuizResponse $model): self {
        return new self(
            id: $model->getKey(),
            quiz_id: $model->quiz_id,
            user_id: $model->user_id,
            attempt: $model->attempt,
            score: $model->score,
            started_at: $model->started_at?->toIso8601String(),
            finished_at: $model->finished_at?->toIso8601String(),
            quiz: $model->relationLoaded('quiz') ? QuizData::from($model->quiz) : null,
            user: $model->relationLoaded('user') ? UserData::from($model->user) : null,
            quiz_response_answers: $model->relationLoaded('quiz_response_answers')
                ? new DataCollection(QuizResponseAnswerData::class, $model->quiz_response_answers)
                : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
