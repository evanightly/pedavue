<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Contracts\Validation\Rule;

class SaveStageQuizProgressRequest extends AbstractWorkspaceStageRequest {
    public function authorize(): bool {
        if (!parent::authorize()) {
            return false;
        }

        return $this->moduleStage()->isQuiz();
    }

    /**
     * @return array<string, Rule|array<mixed>|string>
     */
    public function rules(): array {
        return [
            'answers' => ['required', 'array'],
            'answers.*' => ['array'],
            'answers.*.*' => ['integer', 'distinct'],
        ];
    }

    protected function prepareForValidation(): void {
        $answers = $this->input('answers');

        if ($answers === null) {
            $this->merge(['answers' => []]);

            return;
        }

        if (!is_array($answers)) {
            $this->merge(['answers' => []]);

            return;
        }

        $normalized = [];

        foreach ($answers as $questionId => $value) {
            if (is_array($value)) {
                $normalized[$questionId] = array_values($value);

                continue;
            }

            if ($value === null || $value === '') {
                $normalized[$questionId] = [];

                continue;
            }

            $normalized[$questionId] = [$value];
        }

        $this->merge([
            'answers' => $normalized,
        ]);
    }

    /**
     * @return array<int|string, array<int>>
     */
    public function sanitizedAnswers(): array {
        $answers = $this->validated('answers');

        if (!is_array($answers)) {
            return [];
        }

        $sanitized = [];

        foreach ($answers as $questionId => $optionIds) {
            $parsedQuestionId = (int) $questionId;

            if ($parsedQuestionId <= 0) {
                continue;
            }

            $values = collect((array) $optionIds)
                ->map(static fn ($value) => (int) $value)
                ->filter(static fn (int $value) => $value > 0)
                ->unique()
                ->values()
                ->all();

            $sanitized[$parsedQuestionId] = $values;
        }

        return $sanitized;
    }
}
