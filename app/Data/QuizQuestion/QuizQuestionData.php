<?php

namespace App\Data\QuizQuestion;

use App\Data\Quiz\QuizData;
use App\Data\QuizQuestionOption\QuizQuestionOptionData;
use App\Models\QuizQuestion;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Support\Validation\ValidationContext;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizQuestionData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?int $quiz_id,
        public string $question,
        public ?string $question_image,
        public ?string $question_image_url,
        public bool|Optional $is_answer_shuffled = false,
        public ?int $order,
        public ?QuizData $quiz = null,
        #[DataCollectionOf(QuizQuestionOptionData::class)]
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
            question_image: $model->question_image,
            question_image_url: static::resolveQuestionImageUrl($model->question_image),
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

    public static function rules(ValidationContext $context = null): array {
        $defaultRules = [
            'quiz_id' => ['integer', 'exists:quizzes,id'],
        ];
        switch (request()->route()->getName()) {
            case 'quizzes.questions.add':
                return [
                    ...$defaultRules,
                    'quiz_question_options' => ['required', 'array'],
                ];
            default:
                return $defaultRules;
        }
    }
    
    private static function resolveQuestionImageUrl(?string $path): ?string {
        if (!$path) {
            return null;
        }

        if (!Storage::disk('public')->exists($path)) {
            return null;
        }

        return asset('storage/' . ltrim($path, '/'));
    }
}
