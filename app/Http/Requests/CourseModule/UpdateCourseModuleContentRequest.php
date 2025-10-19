<?php

namespace App\Http\Requests\CourseModule;

use App\Models\Course;
use App\Models\Module;
use App\Models\ModuleStage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * @mixin \Illuminate\Http\Request
 */
class UpdateCourseModuleContentRequest extends FormRequest {
    public function authorize(): bool {
        $course = $this->route('course');
        $module = $this->route('module');
        $stage = $this->route('stage');

        if (!$course instanceof Course || !$module instanceof Module || !$stage instanceof ModuleStage) {
            return false;
        }

        if ($module->course_id !== $course->getKey()) {
            return false;
        }

        if ($stage->module_id !== $module->getKey()) {
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
            'quiz.questions.*.is_answer_shuffled' => ['nullable', 'boolean'],
            'quiz.questions.*.order' => ['nullable', 'integer', 'min:1'],
            'quiz.questions.*.existing_question_image' => ['nullable', 'string'],
            'quiz.questions.*.question_image' => ['nullable', 'file', 'image', 'max:2048'],
            'quiz.questions.*.remove_question_image' => ['nullable', 'boolean'],
            'quiz.questions.*.options' => ['nullable', 'array'],
            'quiz.questions.*.options.*.option_text' => ['nullable', 'string'],
            'quiz.questions.*.options.*.is_correct' => ['nullable', 'boolean'],
            'quiz.questions.*.options.*.order' => ['nullable', 'integer', 'min:1'],
            'quiz.questions.*.options.*.existing_option_image' => ['nullable', 'string'],
            'quiz.questions.*.options.*.option_image' => ['nullable', 'file', 'image', 'max:2048'],
            'quiz.questions.*.options.*.remove_option_image' => ['nullable', 'boolean'],
            'content' => ['nullable', 'array'],
            'content.title' => ['nullable', 'string', 'max:255'],
            'content.description' => ['nullable', 'string'],
            'content.content_type' => ['nullable', 'string', 'max:100'],
            'content.duration' => ['nullable', 'integer', 'min:1'],
            'content.content_url' => ['nullable', 'url', 'max:2048'],
            'content.file' => ['nullable', 'file', 'max:20480'],
            'content.remove_file' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void {
        $validator->after(function (Validator $validator): void {
            $stage = $this->route('stage');
            if (!$stage instanceof ModuleStage) {
                return;
            }

            $type = $this->input('type');

            if ($type === 'content') {
                $content = $this->input('content', []);
                $title = Arr::get($content, 'title');
                $contentType = Arr::get($content, 'content_type');
                $contentUrl = Arr::get($content, 'content_url');
                $removeFile = (bool) Arr::get($content, 'remove_file', false);
                $file = $this->file('content.file');
                $existingFile = $stage->module_content?->file_path;

                if (!is_string($title) || trim($title) === '') {
                    $validator->errors()->add('content.title', 'Judul konten wajib diisi.');
                }

                $hasUrl = is_string($contentUrl) && trim($contentUrl) !== '';
                $canKeepExistingFile = !$removeFile && is_string($existingFile) && $existingFile !== '';

                if (!$file && !$canKeepExistingFile && $hasUrl) {
                    if (!is_string($contentType) || trim($contentType) === '') {
                        $validator->errors()->add('content.content_type', 'Tentukan jenis konten saat menggunakan tautan.');
                    }
                }

                if (!$file && !$hasUrl && !$canKeepExistingFile) {
                    $validator->errors()->add('content.content_url', 'Unggah berkas, isi tautan konten, atau pertahankan berkas yang ada.');
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
            $existingQuestionImage = Arr::get($question, 'existing_question_image');
            $removeQuestionImage = (bool) Arr::get($question, 'remove_question_image', false);

            $questionImageUpload = $this->file('quiz.questions.' . $index . '.question_image');
            $hasUploadedQuestionImage = $questionImageUpload instanceof UploadedFile && $questionImageUpload->isValid();
            $hasExistingQuestionImage = is_string($existingQuestionImage) && trim($existingQuestionImage) !== '' && !$removeQuestionImage;

            if ((!is_string($questionText) || trim($questionText) === '') && !$hasUploadedQuestionImage && !$hasExistingQuestionImage) {
                $validator->errors()->add($questionPath . '.question', 'Isi teks pertanyaan atau unggah gambar.');
            }

            $options = Arr::get($question, 'options');
            if (!is_array($options) || count($options) < 2) {
                $validator->errors()->add($questionPath . '.options', 'Setiap pertanyaan memerlukan minimal dua jawaban.');

                continue;
            }

            $hasCorrect = false;
            foreach ($options as $optionIndex => $option) {
                $optionTextPath = $questionPath . '.options.' . $optionIndex . '.option_text';

                if (!is_array($option)) {
                    $validator->errors()->add($optionTextPath, 'Jawaban tidak valid.');

                    continue;
                }

                $optionText = Arr::get($option, 'option_text');
                $existingImage = Arr::get($option, 'existing_option_image');
                $removeImage = (bool) Arr::get($option, 'remove_option_image', false);

                $optionImageUpload = $this->file('quiz.questions.' . $index . '.options.' . $optionIndex . '.option_image');
                $hasUploadedImage = $optionImageUpload instanceof UploadedFile && $optionImageUpload->isValid();
                $hasExistingImage = is_string($existingImage) && trim($existingImage) !== '' && !$removeImage;

                if ((!is_string($optionText) || trim($optionText) === '') && !$hasUploadedImage && !$hasExistingImage) {
                    $validator->errors()->add($optionTextPath, 'Isi teks jawaban atau unggah gambar.');
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
