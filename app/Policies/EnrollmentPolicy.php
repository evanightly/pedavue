<?php

namespace App\Policies;

use App\Models\Enrollment;
use App\Models\User;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Auth\Access\HandlesAuthorization;

class EnrollmentPolicy {
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool {
        return $user->hasPermissionTo(PermissionEnum::ReadEnrollment) || $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Enrollment $enrollment): bool {
        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        if ($enrollment->user_id === $user->getKey()) {
            return true;
        }

        if ($user->hasPermissionTo(PermissionEnum::ReadEnrollment) && $this->teachesCourse($user, $enrollment)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool {
        return $user->hasPermissionTo(PermissionEnum::CreateEnrollment) || $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Enrollment $enrollment): bool {
        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        if ($user->hasPermissionTo(PermissionEnum::UpdateEnrollment) && $this->teachesCourse($user, $enrollment)) {
            return true;
        }

        return $enrollment->user_id === $user->getKey();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Enrollment $enrollment): bool {
        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        if ($user->hasPermissionTo(PermissionEnum::DeleteEnrollment) && $this->teachesCourse($user, $enrollment)) {
            return true;
        }

        return $enrollment->user_id === $user->getKey();
    }

    /**
     * Determine whether the user can bulk delete models.
     */
    public function deleteAny(User $user): bool {
        return $user->hasPermissionTo(PermissionEnum::DeleteEnrollment) || $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Enrollment $enrollment): bool {
        return $this->delete($user, $enrollment);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Enrollment $enrollment): bool {
        return $this->delete($user, $enrollment);
    }

    private function teachesCourse(User $user, Enrollment $enrollment): bool {
        $course = $enrollment->relationLoaded('course') ? $enrollment->course : $enrollment->course()->first();

        if ($course === null) {
            return false;
        }

        if ($course->relationLoaded('course_instructors')) {
            return $course->course_instructors->contains('id', $user->getKey());
        }

        return $course->course_instructors()->where('users.id', $user->getKey())->exists();
    }
}
