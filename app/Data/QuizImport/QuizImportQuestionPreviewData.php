<?php

namespace App\Data\QuizImport;

use App\Data\QuizQuestion\QuizQuestionData;
use App\Data\QuizQuestionOption\QuizQuestionOptionData;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizImportQuestionPreviewData extends Data {
    /**
     * @param  DataCollection<QuizImportOptionPreviewData>  $options
     */
    public function __construct(
        public string $label,
        public ?string $question,
        public bool $has_image,
        public ?string $image_preview,
        #[DataCollectionOf(QuizImportOptionPreviewData::class)]
        public DataCollection $options,
    ) {}

    /**
     * @param  array{question:?string,image:?array{data:string,mime_type:string,extension:string,original_name:string},options:array<int, array{option_text:?string,is_correct:bool,image:?array{data:string,mime_type:string,extension:string,original_name:string}}>}  $payload
     */
    public static function fromImported(array $payload, int $index): self {
        $options = collect($payload['options'] ?? [])
            ->values()
            ->map(fn (array $option, int $optionIndex) => QuizImportOptionPreviewData::fromImported($option, $optionIndex))
            ->all();

        $hasImage = isset($payload['image']) && is_array($payload['image']);
        $imagePreview = $hasImage
            ? 'data:' . ($payload['image']['mime_type'] ?? 'image/png') . ';base64,' . ($payload['image']['data'] ?? '')
            : null;

        return new self(
            label: 'Pertanyaan ' . ($index + 1),
            question: $payload['question'] ?? null,
            has_image: $hasImage,
            image_preview: $imagePreview,
            options: new DataCollection(QuizImportOptionPreviewData::class, $options),
        );
    }

    public static function fromExisting(QuizQuestionData $question, int $index): self {
        $options = $question->quiz_question_options?->toCollection()->map(
            fn (QuizQuestionOptionData $option, int $optionIndex) => QuizImportOptionPreviewData::fromExisting(
                text: $option->option_text,
                isCorrect: (bool) $option->is_correct,
                imageUrl: $option->option_image_url,
                index: $optionIndex,
            )
        )->all() ?? [];

        return new self(
            label: 'Pertanyaan ' . ($index + 1),
            question: $question->question,
            has_image: $question->question_image_url !== null,
            image_preview: $question->question_image_url,
            options: new DataCollection(QuizImportOptionPreviewData::class, $options),
        );
    }
}
