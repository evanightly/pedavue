<?php

namespace App\Http\Requests\CourseModule;

use App\Models\Course;
use App\Models\Module;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @mixin \Illuminate\Http\Request
 */
class ReorderCourseModuleStagesRequest extends FormRequest {
    public function authorize(): bool {
        $course = $this->route('course');
        $module = $this->route('module');

        if (!$course instanceof Course || !$module instanceof Module) {
            return false;
        }

        if ($module->course_id !== $course->getKey()) {
            return false;
        }

        return $this->user()?->can('update', $course) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        $module = $this->route('module');
        $moduleId = $module instanceof Module ? $module->getKey() : 0;

        return [
            'stage_ids' => ['required', 'array', 'min:1'],
            'stage_ids.*' => [
                'required',
                'integer',
                Rule::exists('module_stages', 'id')->where('module_id', $moduleId),
            ],
        ];
    }
}
