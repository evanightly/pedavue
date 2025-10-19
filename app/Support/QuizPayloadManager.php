<?php

namespace App\Support;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionOption;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class QuizPayloadManager {
    /**
     * @param  array<string, mixed>  $payload
     */
    public function createQuiz(array $payload): Quiz {
        $quiz = Quiz::query()->create([
            'name' => $this->sanitizeString(Arr::get($payload, 'name'), 'Kuis'),
            'description' => $this->sanitizeNullableString(Arr::get($payload, 'description')),
            'duration' => $this->sanitizeNullableInt(Arr::get($payload, 'duration')),
            'is_question_shuffled' => (bool) Arr::get($payload, 'is_question_shuffled', false),
            'type' => $this->sanitizeNullableString(Arr::get($payload, 'type')),
        ]);

        $this->syncQuizStructure($quiz, $payload);

        return $quiz->fresh(['quiz_questions.quiz_question_options']) ?? $quiz->load(['quiz_questions.quiz_question_options']);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateQuiz(Quiz $quiz, array $payload): Quiz {
        $quiz->update([
            'name' => $this->sanitizeString(Arr::get($payload, 'name'), $quiz->name ?? 'Kuis'),
            'description' => $this->sanitizeNullableString(Arr::get($payload, 'description')),
            'duration' => $this->sanitizeNullableInt(Arr::get($payload, 'duration')),
            'is_question_shuffled' => (bool) Arr::get($payload, 'is_question_shuffled', false),
            'type' => $this->sanitizeNullableString(Arr::get($payload, 'type')),
        ]);

        $this->syncQuizStructure($quiz, $payload);

        return $quiz->fresh(['quiz_questions.quiz_question_options']) ?? $quiz->load(['quiz_questions.quiz_question_options']);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function syncQuizStructure(Quiz $quiz, array $payload): void {
        $quiz->loadMissing('quiz_questions.quiz_question_options');

        $existingQuestionImages = collect($quiz->quiz_questions)
            ->pluck('question_image')
            ->filter(fn ($path) => is_string($path) && trim($path) !== '')
            ->values();

        $existingOptionImages = collect($quiz->quiz_questions)
            ->flatMap(fn (QuizQuestion $question) => collect($question->quiz_question_options)->pluck('option_image'))
            ->filter(fn ($path) => is_string($path) && trim($path) !== '')
            ->values();

        $quiz->quiz_questions()->delete();

        $questions = Arr::get($payload, 'questions', []);
        $retainedOptionImages = collect();
        $retainedQuestionImages = collect();

        foreach ($questions as $index => $questionData) {
            if (!is_array($questionData)) {
                continue;
            }

            $questionImagePath = $this->resolveQuestionImagePath($questionData, $retainedQuestionImages);

            $question = QuizQuestion::query()->create([
                'quiz_id' => $quiz->getKey(),
                'question_image' => $questionImagePath,
                'question' => $this->sanitizeString(Arr::get($questionData, 'question'), 'Pertanyaan ' . ($index + 1)),
                'is_answer_shuffled' => (bool) Arr::get($questionData, 'is_answer_shuffled', false),
                'order' => $this->sanitizeOrderValue(Arr::get($questionData, 'order'), $index + 1),
            ]);

            $options = Arr::get($questionData, 'options', []);

            foreach ($options as $optionIndex => $optionData) {
                if (!is_array($optionData)) {
                    continue;
                }

                QuizQuestionOption::query()->create([
                    'quiz_question_id' => $question->getKey(),
                    'option_text' => $this->sanitizeString(
                        Arr::get($optionData, 'option_text'),
                        'Jawaban ' . ($optionIndex + 1)
                    ),
                    'is_correct' => (bool) Arr::get($optionData, 'is_correct', false),
                    'order' => $this->sanitizeOrderValue(Arr::get($optionData, 'order'), $optionIndex + 1),
                    'option_image' => $this->resolveOptionImagePath($optionData, $retainedOptionImages),
                ]);
            }
        }

        $this->deleteUnretainedQuestionImages($existingQuestionImages, $retainedQuestionImages);
        $this->deleteUnretainedOptionImages($existingOptionImages, $retainedOptionImages);
    }

    /**
     * @param  array<string, mixed>  $optionData
     */
    private function resolveOptionImagePath(array $optionData, Collection $retainedImages): ?string {
        $upload = Arr::get($optionData, 'option_image');
        if ($upload instanceof UploadedFile && $upload->isValid()) {
            return $upload->store('courses/quizzes/options', 'public');
        }

        $existing = Arr::get($optionData, 'existing_option_image');
        $shouldRemove = (bool) Arr::get($optionData, 'remove_option_image', false);

        if (is_string($existing) && trim($existing) !== '' && !$shouldRemove) {
            $retainedImages->push($existing);

            return $existing;
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $questionData
     */
    private function resolveQuestionImagePath(array $questionData, Collection $retainedImages): ?string {
        $upload = Arr::get($questionData, 'question_image');
        if ($upload instanceof UploadedFile && $upload->isValid()) {
            return $upload->store('courses/quizzes/questions', 'public');
        }

        $existing = Arr::get($questionData, 'existing_question_image');
        $shouldRemove = (bool) Arr::get($questionData, 'remove_question_image', false);

        if (is_string($existing) && trim($existing) !== '' && !$shouldRemove) {
            $retainedImages->push($existing);

            return $existing;
        }

        return null;
    }

    private function deleteUnretainedOptionImages(Collection $existingImages, Collection $retainedImages): void {
        $pathsToDelete = $existingImages
            ->diff($retainedImages->unique())
            ->filter(fn ($path) => is_string($path) && trim($path) !== '');

        foreach ($pathsToDelete as $path) {
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    private function deleteUnretainedQuestionImages(Collection $existingImages, Collection $retainedImages): void {
        $pathsToDelete = $existingImages
            ->diff($retainedImages->unique())
            ->filter(fn ($path) => is_string($path) && trim($path) !== '');

        foreach ($pathsToDelete as $path) {
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    private function sanitizeString(mixed $value, string $fallback): string {
        if (!is_string($value)) {
            return $fallback;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? $fallback : $trimmed;
    }

    private function sanitizeNullableString(mixed $value): ?string {
        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function sanitizeNullableInt(mixed $value): ?int {
        if ($value === null || $value === '') {
            return null;
        }

        if (filter_var($value, FILTER_VALIDATE_INT) === false) {
            return null;
        }

        return (int) $value;
    }

    private function sanitizeOrderValue(mixed $value, int $fallback): int {
        if (filter_var($value, FILTER_VALIDATE_INT) === false) {
            return $fallback;
        }

        $order = (int) $value;

        return $order < 1 ? $fallback : $order;
    }
}
