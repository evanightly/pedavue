<?php

namespace App\Http\Requests\CourseModule;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
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
            'stages.*.quiz' => ['nullable', 'array'],
            'stages.*.quiz.name' => ['nullable', 'string', 'max:255'],
            'stages.*.quiz.description' => ['nullable', 'string'],
            'stages.*.quiz.duration' => ['nullable', 'integer', 'min:1'],
            'stages.*.quiz.is_question_shuffled' => ['nullable', 'boolean'],
            'stages.*.quiz.type' => ['nullable', 'string', 'max:100'],
            'stages.*.quiz.questions' => ['nullable', 'array'],
            'stages.*.quiz.questions.*.question' => ['nullable', 'string'],
            'stages.*.quiz.questions.*.is_answer_shuffled' => ['nullable', 'boolean'],
            'stages.*.quiz.questions.*.order' => ['nullable', 'integer', 'min:1'],
            'stages.*.quiz.questions.*.existing_question_image' => ['nullable', 'string'],
            'stages.*.quiz.questions.*.question_image' => ['nullable', 'file', 'image', 'max:2048'],
            'stages.*.quiz.questions.*.remove_question_image' => ['nullable', 'boolean'],
            'stages.*.quiz.questions.*.options' => ['nullable', 'array'],
            'stages.*.quiz.questions.*.options.*.option_text' => ['nullable', 'string'],
            'stages.*.quiz.questions.*.options.*.is_correct' => ['nullable', 'boolean'],
            'stages.*.quiz.questions.*.options.*.order' => ['nullable', 'integer', 'min:1'],
            'stages.*.quiz.questions.*.options.*.existing_option_image' => ['nullable', 'string'],
            'stages.*.quiz.questions.*.options.*.option_image' => ['nullable', 'file', 'image', 'max:2048'],
            'stages.*.quiz.questions.*.options.*.remove_option_image' => ['nullable', 'boolean'],
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
                    $quizId = Arr::get($stage, 'quiz_id');

                    if ($quizId === null || $quizId === '') {
                        $quizData = Arr::get($stage, 'quiz');

                        if (!is_array($quizData)) {
                            $validator->errors()->add("stages.$index.quiz", 'Isi detail kuis terlebih dahulu.');

                            continue;
                        }

                        $this->validateQuizPayload($validator, $quizData, $index);
                    }
                }
            }
        });
    }

    /**
     * @param  array<string, mixed>  $quizData
     */
    private function validateQuizPayload(Validator $validator, array $quizData, int $stageIndex): void {
        $basePath = 'stages.' . $stageIndex . '.quiz';

        $name = Arr::get($quizData, 'name');
        if (!is_string($name) || trim($name) === '') {
            $validator->errors()->add($basePath . '.name', 'Nama kuis wajib diisi.');
        }

        $questions = Arr::get($quizData, 'questions');
        if (!is_array($questions) || count($questions) === 0) {
            $validator->errors()->add($basePath . '.questions', 'Tambahkan minimal satu pertanyaan.');

            return;
        }

        foreach ($questions as $index => $question) {
            $questionPath = $basePath . '.questions.' . $index;
            if (!is_array($question)) {
                $validator->errors()->add($questionPath, 'Pertanyaan tidak valid.');

                continue;
            }

            $questionText = Arr::get($question, 'question');
            $existingQuestionImage = Arr::get($question, 'existing_question_image');
            $removeQuestionImage = (bool) Arr::get($question, 'remove_question_image', false);

            $questionImageUpload = $this->file('stages.' . $stageIndex . '.quiz.questions.' . $index . '.question_image');
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

                $optionImageUpload = $this->file('stages.' . $stageIndex . '.quiz.questions.' . $index . '.options.' . $optionIndex . '.option_image');
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
