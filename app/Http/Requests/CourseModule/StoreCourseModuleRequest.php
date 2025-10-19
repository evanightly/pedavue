<?php

namespace App\Http\Requests\CourseModule;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * @mixin \Illuminate\Http\Request
 */
class StoreCourseModuleRequest extends FormRequest {
    protected function prepareForValidation(): void {
        if (!is_array($this->input('stages'))) {
            $this->merge([
                'stages' => [],
            ]);
        }
    }

    public function authorize(): bool {
        $course = $this->route('course');

        return $course instanceof Course && $this->user()?->can('update', $course);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'thumbnail' => ['nullable', 'file', 'image', 'max:2048'],
            'duration' => ['nullable', 'integer', 'min:1'],
            'order' => ['nullable', 'integer', 'min:1'],
            'stages' => ['required', 'array', 'min:1'],
            'stages.*.type' => ['required', Rule::in(['content', 'quiz'])],
            'stages.*.order' => ['nullable', 'integer', 'min:1'],
            'stages.*.quiz_id' => ['nullable', 'integer', 'exists:quizzes,id'],
            'stages.*.content' => ['nullable', 'array'],
            'stages.*.content.title' => ['nullable', 'string', 'max:255'],
            'stages.*.content.description' => ['nullable', 'string'],
            'stages.*.content.content_type' => ['nullable', 'string', 'max:100'],
            'stages.*.content.duration' => ['nullable', 'integer', 'min:1'],
            'stages.*.content.content_url' => ['nullable', 'url', 'max:2048'],
            'stages.*.content.file' => ['nullable', 'file', 'max:20480'],
        ];
    }

    public function withValidator(Validator $validator): void {
        $validator->after(function (Validator $validator): void {
            $stages = $this->input('stages', []);

            foreach ($stages as $index => $stage) {
                $type = $stage['type'] ?? null;

                if ($type === 'content') {
                    $title = Arr::get($stage, 'content.title');
                    $contentType = Arr::get($stage, 'content.content_type');
                    $contentUrl = Arr::get($stage, 'content.content_url');
                    $file = $this->file("stages.$index.content.file");

                    if (!is_string($title) || trim($title) === '') {
                        $validator->errors()->add("stages.$index.content.title", 'Judul konten wajib diisi.');
                    }

                    $hasUrl = is_string($contentUrl) && trim($contentUrl) !== '';
                    if (!$file && $hasUrl) {
                        if (!is_string($contentType) || trim($contentType) === '') {
                            $validator->errors()->add("stages.$index.content.content_type", 'Tentukan jenis konten saat menggunakan tautan.');
                        }
                    }

                    if (!$file && !$hasUrl) {
                        $validator->errors()->add(
                            "stages.$index.content.content_url",
                            'Sertakan tautan konten atau unggah berkas pendukung.'
                        );
                    }
                }

                if ($type === 'quiz') {
                    $quizId = $stage['quiz_id'] ?? null;

                    if ($quizId === null || $quizId === '') {
                        $validator->errors()->add("stages.$index.quiz_id", 'Pilih kuis yang akan ditautkan.');
                    }
                }
            }
        });
    }
}
