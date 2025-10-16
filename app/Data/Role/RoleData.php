<?php

namespace App\Data\Role;

use App\Models\Role;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class RoleData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $name,
        public ?string $guard_name,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(Role $model): self {
        return new self(
            id: $model->getKey(),
            name: $model->name,
            guard_name: $model->guard_name,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
