<?php

namespace App\Data\Role;

use App\Data\Permission\PermissionData;
use App\Models\Role;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class RoleData extends Data {
    /**
     * @param  array<int, int>|null  $permissionIds
     */
    public function __construct(
        public int|Optional $id,
        public ?string $name,
        public ?string $guard_name,
        #[DataCollectionOf(PermissionData::class)]
        #[LiteralTypeScriptType('App.Data.Permission.PermissionData[]|null')]
        public ?DataCollection $permissions,
        #[LiteralTypeScriptType('number[]|null')]
        public ?array $permissionIds,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(Role $model): self {
        return new self(
            id: $model->getKey(),
            name: $model->name,
            guard_name: $model->guard_name,
            permissions: $model->relationLoaded('permissions')
                ? new DataCollection(PermissionData::class, $model->permissions)
                : null,
            permissionIds: $model->relationLoaded('permissions')
                ? $model->permissions->pluck('id')->map(static fn ($id) => (int) $id)->all()
                : $model->permissions()->pluck('permissions.id')->map(static fn ($id) => (int) $id)->all(),
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }

    public static function rules(): array {
        return [
            'permissionIds' => ['nullable', 'array'],
            'permissionIds.*' => ['integer', 'exists:permissions,id'],
        ];
    }
}
