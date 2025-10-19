<?php

namespace App\Policies;

use App\Models\Permission;
use App\Models\User;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Auth\Access\HandlesAuthorization;

class PermissionPolicy {
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
        return $user->hasPermissionTo(PermissionEnum::ReadPermission);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Permission $permission): bool {
        return $user->hasPermissionTo(PermissionEnum::ReadPermission);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool {
        return $user->hasPermissionTo(PermissionEnum::CreatePermission);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Permission $permission): bool {
        return $user->hasPermissionTo(PermissionEnum::UpdatePermission);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Permission $permission): bool {
        return $user->hasPermissionTo(PermissionEnum::DeletePermission);
    }

    /**
     * Determine whether the user can bulk delete models.
     */
    public function deleteAny(User $user): bool {
        return $user->hasPermissionTo(PermissionEnum::DeletePermission);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Permission $permission): bool {
        return $user->hasPermissionTo(PermissionEnum::DeletePermission);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Permission $permission): bool {
        return $user->hasPermissionTo(PermissionEnum::DeletePermission);
    }
}
