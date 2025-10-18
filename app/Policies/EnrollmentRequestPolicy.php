<?php

namespace App\Policies;

use App\Models\EnrollmentRequest;
use App\Models\User;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Auth\Access\HandlesAuthorization;

class EnrollmentRequestPolicy {
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool {
        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        if ($user->hasRole(RoleEnum::Student->value)) {
            return true;
        }

        if ($user->hasPermissionTo(PermissionEnum::ReadEnrollment) || $user->hasPermissionTo(PermissionEnum::CreateEnrollment)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, EnrollmentRequest $enrollmentRequest): bool {
        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        if ($enrollmentRequest->user_id === $user->getKey()) {
            return true;
        }

        return $this->respond($user, $enrollmentRequest);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool {
        return $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, EnrollmentRequest $enrollmentRequest): bool {
        return $this->respond($user, $enrollmentRequest);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, EnrollmentRequest $enrollmentRequest): bool {
        return $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    /**
     * Determine whether the user can bulk delete models.
     */
    public function deleteAny(User $user): bool {
        return $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, EnrollmentRequest $enrollmentRequest): bool {
        return $this->delete($user, $enrollmentRequest);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, EnrollmentRequest $enrollmentRequest): bool {
        return $this->delete($user, $enrollmentRequest);
    }

    public function respond(User $user, EnrollmentRequest $enrollmentRequest): bool {
        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        if (!$user->hasPermissionTo(PermissionEnum::CreateEnrollment)) {
            return false;
        }

        $course = $enrollmentRequest->relationLoaded('course') ? $enrollmentRequest->course : $enrollmentRequest->course()->with('course_instructors')->first();

        if ($course === null) {
            return false;
        }

        if ($course->relationLoaded('course_instructors')) {
            return $course->course_instructors->contains('id', $user->getKey());
        }

        return $course->course_instructors()->where('users.id', $user->getKey())->exists();
    }
}
