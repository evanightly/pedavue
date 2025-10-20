<?php

namespace App\Http\Requests\Quiz;

use App\Models\Quiz;
use Illuminate\Foundation\Http\FormRequest;

/**
 * @mixin \Illuminate\Http\Request
 */
class QuizImportConfirmRequest extends FormRequest {
    public function authorize(): bool {
        $quiz = $this->route('quiz');

        return $quiz instanceof Quiz && $this->user()?->can('update', $quiz) === true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        return [
            'token' => ['required', 'string'],
            'mode' => ['required', 'string', 'in:append,replace'],
        ];
    }

    public function attributes(): array {
        return [
            'token' => 'token pratinjau',
            'mode' => 'opsi impor',
        ];
    }
}
