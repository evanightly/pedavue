<?php

namespace App\Http\Requests\Workspace;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\ModuleStage;
use App\Models\User;
use App\Support\WorkspaceProgressManager;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Http\FormRequest;

/**
 * @mixin \Illuminate\Http\Request
 */
abstract class AbstractWorkspaceStageRequest extends FormRequest {
    protected ?Enrollment $enrollment = null;
    protected ?ModuleStage $moduleStage = null;
    protected ?Module $module = null;
    protected ?Course $course = null;

    /**
     * @throws AuthorizationException
     */
    public function authorize(): bool {
        $user = $this->user();
        $course = $this->route('course');
        $module = $this->route('module');
        $stage = $this->route('module_stage');

        if (!$stage instanceof ModuleStage) {
            $stage = $this->route('stage');
        }

        if (!$user instanceof User || !$course instanceof Course || !$module instanceof Module || !$stage instanceof ModuleStage) {
            return false;
        }

        if ($module->course_id !== $course->getKey() || $stage->module_id !== $module->getKey()) {
            return false;
        }

        $manager = app(WorkspaceProgressManager::class);
        $enrollment = $manager->getEnrollmentFor($user, $course);

        $this->enrollment = $enrollment;
        $this->moduleStage = $stage;
        $this->module = $module;
        $this->course = $course;

        return $manager->canAccessStage($enrollment, $stage);
    }

    public function enrollment(): Enrollment {
        if ($this->enrollment === null) {
            throw new AuthorizationException('Enrollment tidak tersedia.');
        }

        return $this->enrollment;
    }

    public function moduleStage(): ModuleStage {
        if ($this->moduleStage === null) {
            throw new AuthorizationException('Tahap modul tidak ditemukan.');
        }

        return $this->moduleStage;
    }

    public function module(): Module {
        if ($this->module === null) {
            throw new AuthorizationException('Modul tidak ditemukan.');
        }

        return $this->module;
    }

    public function course(): Course {
        if ($this->course === null) {
            throw new AuthorizationException('Kursus tidak ditemukan.');
        }

        return $this->course;
    }
}
