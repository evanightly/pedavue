<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Auth\Access\HandlesAuthorization;

class RolePolicy {
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool {
        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        return null;
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool {
        return $user->hasPermissionTo(PermissionEnum::ReadRole);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Role $role): bool {
        return $user->hasPermissionTo(PermissionEnum::ReadRole);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool {
        return $user->hasPermissionTo(PermissionEnum::CreateRole);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Role $role): bool {
        return $user->hasPermissionTo(PermissionEnum::UpdateRole);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Role $role): bool {
        return $user->hasPermissionTo(PermissionEnum::DeleteRole);
    }

    /**
     * Determine whether the user can bulk delete models.
     */
    public function deleteAny(User $user): bool {
        return $user->hasPermissionTo(PermissionEnum::DeleteRole);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Role $role): bool {
        return $user->hasPermissionTo(PermissionEnum::DeleteRole);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Role $role): bool {
        return $user->hasPermissionTo(PermissionEnum::DeleteRole);
    }
}
