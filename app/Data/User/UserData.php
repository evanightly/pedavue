<?php

namespace App\Data\User;

use App\Data\Role\RoleData;
use App\Models\User;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class UserData extends Data {
    /**
     * @param  array<int, string>|null  $permissions
     * @param  array<int, int>|null  $roleIds
     */
    public function __construct(
        public int|Optional $id,
        public ?string $name,
        public ?string $email,
        public ?string $password,
        public ?string $role,
        #[LiteralTypeScriptType('string[]|null')]
        public ?array $permissions,
        #[DataCollectionOf(RoleData::class)]
        #[LiteralTypeScriptType('App.Data.Role.RoleData[]|null')]
        public ?DataCollection $roles,
        #[LiteralTypeScriptType('number[]|null')]
        public ?array $roleIds,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(User $model): self {
        return new self(
            id: $model->getKey(),
            name: $model->name,
            email: $model->email,
            password: $model->password,
            role: $model->roles->first()?->name,

            permissions: $model->relationLoaded('permissions')
                ? $model->permissions->pluck('name')->all()
                : $model->getAllPermissions()->pluck('name')->all(),
            roles: $model->relationLoaded('roles')
                ? new DataCollection(RoleData::class, $model->roles)
                : null,
            roleIds: $model->relationLoaded('roles')
                ? $model->roles->pluck('id')->map(static fn ($id) => (int) $id)->all()
                : $model->roles()->pluck('roles.id')->map(static fn ($id) => (int) $id)->all(),
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }

    public static function rules(): array {
        return [
            'roleIds' => ['nullable', 'array'],
            'roleIds.*' => ['integer', 'exists:roles,id'],
        ];
    }
}
