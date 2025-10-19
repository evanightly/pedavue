<?php

namespace App\Http\Requests\Quiz;

use App\Models\Quiz;
use Illuminate\Foundation\Http\FormRequest;

/**
 * @mixin \Illuminate\Http\Request
 */
class QuizImportPreviewRequest extends FormRequest {
    public function authorize(): bool {
        $quiz = $this->route('quiz');

        return $quiz instanceof Quiz && $this->user()?->can('update', $quiz) === true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        if ($this->isMethod('get')) {
            return [
                'token' => ['required', 'string'],
            ];
        }

        return [
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240'],
        ];
    }

    public function attributes(): array {
        return [
            'file' => 'berkas Excel',
            'token' => 'token pratinjau',
        ];
    }

    public function messages(): array {
        return [
            'file.required' => 'Pilih berkas Excel sebelum melanjutkan.',
            'file.file' => 'Berkas Excel tidak valid. Coba pilih ulang berkas Anda.',
            'file.mimes' => 'Format berkas harus .xlsx atau .xls.',
            'file.max' => 'Berkas Excel melebihi batas 10 MB. Kurangi ukuran gambar di dalam file lalu coba lagi.',
            'file.uploaded' => 'Berkas Excel gagal diunggah. Pastikan ukurannya tidak melebihi 10 MB dan file tidak sedang dibuka aplikasi lain.',
        ];
    }
}
