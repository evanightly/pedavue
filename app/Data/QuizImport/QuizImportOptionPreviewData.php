<?php

namespace App\Data\QuizImport;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizImportOptionPreviewData extends Data {
    public function __construct(
        public string|Optional $label,
        public ?string $option_text,
        public bool $is_correct,
        public bool $has_image,
        public ?string $image_preview,
    ) {}

    /**
     * @param  array{option_text:?string,is_correct:bool,image:?array{data:string,mime_type:string,extension:string,original_name:string}}  $payload
     */
    public static function fromImported(array $payload, int $index): self {
        $imagePreview = null;
        $hasImage = false;

        if (isset($payload['image']) && is_array($payload['image'])) {
            $hasImage = true;
            $imagePreview = 'data:' . ($payload['image']['mime_type'] ?? 'image/png') . ';base64,' . ($payload['image']['data'] ?? '');
        }

        return new self(
            label: 'Opsi ' . ($index + 1),
            option_text: $payload['option_text'] ?? null,
            is_correct: (bool) ($payload['is_correct'] ?? false),
            has_image: $hasImage,
            image_preview: $imagePreview,
        );
    }

    public static function fromExisting(?string $text, bool $isCorrect, ?string $imageUrl, int $index): self {
        return new self(
            label: 'Opsi ' . ($index + 1),
            option_text: $text,
            is_correct: $isCorrect,
            has_image: $imageUrl !== null,
            image_preview: $imageUrl,
        );
    }
}
