<?php

namespace App\Http\Requests\CourseModule;

use App\Models\Course;
use App\Models\Module;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * @mixin \Illuminate\Http\Request
 */
class StoreCourseModuleContentRequest extends FormRequest {
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
        return [
            'type' => ['required', Rule::in(['content', 'quiz'])],
            'order' => ['nullable', 'integer', 'min:1'],
            'quiz_id' => ['nullable', 'integer', 'exists:quizzes,id'],
            'quiz' => ['nullable', 'array'],
            'quiz.name' => ['nullable', 'string', 'max:255'],
            'quiz.description' => ['nullable', 'string'],
            'quiz.duration' => ['nullable', 'integer', 'min:1'],
            'quiz.is_question_shuffled' => ['nullable', 'boolean'],
            'quiz.type' => ['nullable', 'string', 'max:100'],
            'quiz.questions' => ['nullable', 'array'],
            'quiz.questions.*.question' => ['nullable', 'string'],
            'quiz.questions.*.points' => ['nullable', 'integer', 'min:1'],
            'quiz.questions.*.is_answer_shuffled' => ['nullable', 'boolean'],
            'quiz.questions.*.order' => ['nullable', 'integer', 'min:1'],
            'quiz.questions.*.options' => ['nullable', 'array'],
            'quiz.questions.*.options.*.option_text' => ['nullable', 'string'],
            'quiz.questions.*.options.*.is_correct' => ['nullable', 'boolean'],
            'quiz.questions.*.options.*.order' => ['nullable', 'integer', 'min:1'],
            'content' => ['nullable', 'array'],
            'content.title' => ['nullable', 'string', 'max:255'],
            'content.description' => ['nullable', 'string'],
            'content.content_type' => ['nullable', 'string', 'max:100'],
            'content.duration' => ['nullable', 'integer', 'min:1'],
            'content.content_url' => ['nullable', 'url', 'max:2048'],
            'content.file' => ['nullable', 'file', 'max:204800'],
            'content.subtitle_file' => ['nullable', 'file', 'mimes:srt,vtt', 'max:5120'],
        ];
    }

    public function withValidator(Validator $validator): void {
        $validator->after(function (Validator $validator): void {
            $type = $this->input('type');

            if ($type === 'content') {
                $title = Arr::get($this->input('content', []), 'title');
                $contentType = Arr::get($this->input('content', []), 'content_type');
                $contentUrl = Arr::get($this->input('content', []), 'content_url');
                $file = $this->file('content.file');

                if (!is_string($title) || trim($title) === '') {
                    $validator->errors()->add('content.title', 'Judul konten wajib diisi.');
                }

                $hasUrl = is_string($contentUrl) && trim($contentUrl) !== '';
                if (!$file && $hasUrl) {
                    if (!is_string($contentType) || trim($contentType) === '') {
                        $validator->errors()->add('content.content_type', 'Tentukan jenis konten saat menggunakan tautan.');
                    }
                }

                if (!$file && !$hasUrl) {
                    $validator->errors()->add('content.content_url', 'Unggah berkas atau isi tautan konten.');
                }
            }

            if ($type === 'quiz' && !$this->filled('quiz_id')) {
                $quizData = $this->input('quiz');

                if (!is_array($quizData)) {
                    $validator->errors()->add('quiz', 'Isi detail kuis terlebih dahulu.');

                    return;
                }

                $this->validateQuizPayload($validator, $quizData);
            }
        });
    }

    /**
     * @param  array<string, mixed>  $quizData
     */
    private function validateQuizPayload(Validator $validator, array $quizData): void {
        $name = Arr::get($quizData, 'name');
        if (!is_string($name) || trim($name) === '') {
            $validator->errors()->add('quiz.name', 'Nama kuis wajib diisi.');
        }

        $questions = Arr::get($quizData, 'questions');
        if (!is_array($questions) || count($questions) === 0) {
            $validator->errors()->add('quiz.questions', 'Tambahkan minimal satu pertanyaan.');

            return;
        }

        foreach ($questions as $index => $question) {
            $questionPath = 'quiz.questions.' . $index;
            if (!is_array($question)) {
                $validator->errors()->add($questionPath, 'Pertanyaan tidak valid.');

                continue;
            }

            $questionText = Arr::get($question, 'question');
            if (!is_string($questionText) || trim($questionText) === '') {
                $validator->errors()->add($questionPath . '.question', 'Isi teks pertanyaan.');
            }

            $pointsValue = Arr::get($question, 'points');
            if ($pointsValue !== null && filter_var($pointsValue, FILTER_VALIDATE_INT) === false) {
                $validator->errors()->add($questionPath . '.points', 'Bobot poin harus berupa angka.');
            } elseif ($pointsValue !== null && (int) $pointsValue < 1) {
                $validator->errors()->add($questionPath . '.points', 'Bobot poin minimal 1.');
            }

            $options = Arr::get($question, 'options');
            if (!is_array($options) || count($options) < 2) {
                $validator->errors()->add($questionPath . '.options', 'Setiap pertanyaan memerlukan minimal dua jawaban.');

                continue;
            }

            $hasCorrect = false;
            foreach ($options as $optionIndex => $option) {
                $optionPath = $questionPath . '.options.' . $optionIndex . '.option_text';

                if (!is_array($option)) {
                    $validator->errors()->add($optionPath, 'Jawaban tidak valid.');

                    continue;
                }

                $optionText = Arr::get($option, 'option_text');
                if (!is_string($optionText) || trim($optionText) === '') {
                    $validator->errors()->add($optionPath, 'Isi teks jawaban.');
                }

                if ((bool) Arr::get($option, 'is_correct', false)) {
                    $hasCorrect = true;
                }
            }

            if (!$hasCorrect) {
                $validator->errors()->add($questionPath . '.options', 'Tandai minimal satu jawaban benar.');
            }
        }
    }
}
