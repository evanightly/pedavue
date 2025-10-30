<?php

namespace App\Data\QuizResult;

use App\Data\Quiz\QuizData;
use App\Data\User\UserData;
use App\Models\QuizResult;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class QuizResultData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?int $score,
        public ?int $earned_points,
        public ?int $total_points,
        public ?int $attempt,
        public ?string $started_at,
        public ?string $finished_at,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.User.UserData | null')]
        public ?UserData $user,
        #[TypeScriptType('App.Data.Quiz.QuizData | null')]
        public ?QuizData $quiz,
    ) {}

    public static function fromModel(QuizResult $model): self {
        return new self(
            id: $model->getKey(),
            score: $model->score !== null ? (int) $model->score : null,
            earned_points: $model->earned_points !== null ? (int) $model->earned_points : null,
            total_points: $model->total_points !== null ? (int) $model->total_points : null,
            attempt: $model->attempt !== null ? (int) $model->attempt : null,
            started_at: $model->started_at?->toIso8601String(),
            finished_at: $model->finished_at?->toIso8601String(),
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            user: $model->relationLoaded('user') && $model->user
                ? UserData::fromModel($model->user)
                : null,
            quiz: $model->relationLoaded('quiz') && $model->quiz
                ? QuizData::fromModel($model->quiz)
                : null,
        );
    }
}
