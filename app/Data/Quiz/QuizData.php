<?php

namespace App\Data\Quiz;

use App\Data\QuizQuestion\QuizQuestionData;
use App\Models\Quiz;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Support\Validation\ValidationContext;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $name,
        public ?string $description,
        public ?int $duration,
        public bool|Optional $is_question_shuffled = false,
        public ?string $type,
        #[DataCollectionOf(QuizQuestionData::class)]
        #[LiteralTypeScriptType('App.Data.QuizQuestion.QuizQuestionData[]|null')]
        public ?DataCollection $quiz_questions,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(Quiz $model): self {
        return new self(
            id: $model->getKey(),
            name: $model->name,
            description: $model->description ?? null,
            duration: $model->duration ?? null,
            is_question_shuffled: $model->is_question_shuffled,
            type: $model->type,
            quiz_questions: $model->relationLoaded('quiz_questions')
                ? new DataCollection(QuizQuestionData::class, $model->quiz_questions)
                : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }

    public static function rules(ValidationContext $context = null): array {
        

        switch (request()->route()->getName()) {
            
            case 'quizzes.import.questions':
                return [
                    'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
                ];
            
            default:
                return [];
        }
    }
}

