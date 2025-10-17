<?php

namespace App\Data\Quiz;

use App\Models\Quiz;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $name,
        public ?string $description,
        public ?int $duration,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(Quiz $model): self {
        return new self(
            id: $model->getKey(),
            name: $model->name,
            description: $model->description ?? null,
            duration: $model->duration ?? null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
