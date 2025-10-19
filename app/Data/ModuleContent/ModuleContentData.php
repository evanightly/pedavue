<?php

namespace App\Data\ModuleContent;

use App\Data\ModuleStage\ModuleStageData;
use App\Models\ModuleContent;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class ModuleContentData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $title,
        public ?string $description,
        public ?string $file_path,
        public ?string $content_url,
        public ?string $file_url,
        public ?int $duration,
        public ?string $content_type,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.ModuleStage.ModuleStageData | null')]
        public ?ModuleStageData $module_stage,
    ) {}

    public static function fromModel(ModuleContent $model): self {
        return new self(
            id: $model->getKey(),
            title: $model->title,
            description: $model->description,
            file_path: $model->file_path,
            content_url: $model->content_url,
            file_url: static::resolveFileUrl($model->file_path),
            duration: $model->duration !== null ? (int) $model->duration : null,
            content_type: $model->content_type,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            module_stage: $model->relationLoaded('module_stage') && $model->module_stage
                ? ModuleStageData::fromModel($model->module_stage)
                : null,
        );
    }

    private static function resolveFileUrl(?string $path): ?string {
        if (!$path) {
            return null;
        }

        if (!Storage::disk('public')->exists($path)) {
            return null;
        }

        return asset('storage/' . ltrim($path, '/'));
    }
}
