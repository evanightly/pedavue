<?php

namespace App\Data\Permission;

use App\Models\Permission;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class PermissionData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $name,
        public ?string $guard_name,
        public ?string $group,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(Permission $model): self {
        return new self(
            id: $model->getKey(),
            name: $model->name,
            guard_name: $model->guard_name,
            group: $model->group,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
