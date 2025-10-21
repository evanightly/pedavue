<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\User;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Auth\Access\HandlesAuthorization;

class CoursePolicy {
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool {
        if ($user->hasPermissionTo(PermissionEnum::ReadCourse) || $user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        if ($user->hasRole(RoleEnum::Student->value)) {
            return $user->enrollments()->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Course $course): bool {
        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        if ($this->isCourseInstructor($user, $course)) {
            return true;
        }

        if ($user->hasRole(RoleEnum::Student->value)) {
            return true;
        }

        return $this->isEnrolledStudent($user, $course);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool {
        return $user->hasPermissionTo(PermissionEnum::CreateCourse);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Course $course): bool {
        if ($user->hasPermissionTo(PermissionEnum::UpdateCourse) && $this->isCourseInstructor($user, $course)) {
            return true;
        }

        return $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Course $course): bool {
        if ($user->hasPermissionTo(PermissionEnum::DeleteCourse) && $this->isCourseInstructor($user, $course)) {
            return true;
        }

        return $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    /**
     * Determine whether the user can bulk delete models.
     */
    public function deleteAny(User $user): bool {
        return $user->hasPermissionTo(PermissionEnum::DeleteCourse) || $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Course $course): bool {
        if ($user->hasPermissionTo(PermissionEnum::DeleteCourse) && $this->isCourseInstructor($user, $course)) {
            return true;
        }

        return $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Course $course): bool {
        if ($user->hasPermissionTo(PermissionEnum::DeleteCourse) && $this->isCourseInstructor($user, $course)) {
            return true;
        }

        return $user->hasRole(RoleEnum::SuperAdmin->value);
    }

    public function assignStudents(User $user, Course $course): bool {
        if (!$user->hasPermissionTo(PermissionEnum::CreateEnrollment)) {
            return false;
        }

        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        return $this->isCourseInstructor($user, $course);
    }

    public function accessWorkspace(User $user, Course $course): bool {
        if ($user->hasRole(RoleEnum::SuperAdmin->value)) {
            return true;
        }

        if ($this->isCourseInstructor($user, $course)) {
            return true;
        }

        if ($user->hasRole(RoleEnum::Student->value)) {
            return $this->isEnrolledStudent($user, $course);
        }

        if ($user->hasPermissionTo(PermissionEnum::ReadCourse)) {
            return $this->isCourseInstructor($user, $course) || $this->isEnrolledStudent($user, $course);
        }

        return false;
    }

    private function isCourseInstructor(User $user, Course $course): bool {
        if ($course->relationLoaded('course_instructors')) {
            return $course->course_instructors->contains('id', $user->getKey());
        }

        return $course->course_instructors()->where('users.id', $user->getKey())->exists();
    }

    private function isEnrolledStudent(User $user, Course $course): bool {
        if ($course->relationLoaded('students')) {
            return $course->students->contains('id', $user->getKey());
        }

        return $course->students()->where('users.id', $user->getKey())->exists();
    }
}
