<?php

namespace App\Data\Course;

use App\Models\CourseCertificateImage;
use Illuminate\Support\Str;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CourseCertificateImageData extends Data {
    public function __construct(
        public int $id,
        public string $file_path,
        public string $file_url,
        #[LiteralTypeScriptType('number')]
        public int $position_x,
        #[LiteralTypeScriptType('number')]
        public int $position_y,
        #[LiteralTypeScriptType('number')]
        public int $width,
        #[LiteralTypeScriptType('number')]
        public int $height,
        #[LiteralTypeScriptType('number')]
        public int $z_index,
        public ?string $label,
    ) {}

    public static function fromModel(CourseCertificateImage $model): self {
        return new self(
            id: $model->getKey(),
            file_path: $model->file_path,
            file_url: Str::startsWith($model->file_path, ['http://', 'https://']) ? $model->file_path : asset('storage/' . ltrim($model->file_path, '/')),
            position_x: (int) $model->position_x,
            position_y: (int) $model->position_y,
            width: (int) $model->width,
            height: (int) $model->height,
            z_index: (int) $model->z_index,
            label: $model->label,
        );
    }
}
