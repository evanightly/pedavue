<?php

namespace App\Support\QuizImport;

use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QuizImportPreviewStore {
    private const STORAGE_PATH = 'quiz-import/previews';

    private const EXPIRATION_MINUTES = 30;

    /**
     * @param  array<int, array{question:?string,image:?array{data:string,mime_type:string,extension:string,original_name:string},options:array<int, array{option_text:?string,is_correct:bool,image:?array{data:string,mime_type:string,extension:string,original_name:string}}>}  $questions
     * @param  array<int, string>  $warnings
     */
    public function store(int $quizId, int $userId, array $questions, array $warnings = []): string {
        $token = (string) Str::uuid();

        $payload = [
            'quiz_id' => $quizId,
            'user_id' => $userId,
            'questions' => $questions,
            'warnings' => $warnings,
            'created_at' => Carbon::now()->toIso8601String(),
            'expires_at' => Carbon::now()->addMinutes(self::EXPIRATION_MINUTES)->toIso8601String(),
        ];

        Storage::disk('local')->put($this->resolvePath($token), json_encode($payload));

        return $token;
    }

    /**
     * @return array{quiz_id:int,user_id:int,questions:array<int, array{question:?string,image:?array{data:string,mime_type:string,extension:string,original_name:string},options:array<int, array{option_text:?string,is_correct:bool,image:?array{data:string,mime_type:string,extension:string,original_name:string}}>}>,warnings:array<int,string>,created_at:?string,expires_at:?string}|null
     */
    public function retrieve(string $token): ?array {
        $path = $this->resolvePath($token);
        if (!Storage::disk('local')->exists($path)) {
            return null;
        }

        $contents = Storage::disk('local')->get($path);
        $decoded = json_decode($contents, true);
        if (!is_array($decoded)) {
            return null;
        }

        $expiresAt = Arr::get($decoded, 'expires_at');
        if ($expiresAt && Carbon::parse($expiresAt)->isPast()) {
            $this->forget($token);

            return null;
        }

        return $decoded;
    }

    public function forget(string $token): void {
        Storage::disk('local')->delete($this->resolvePath($token));
    }

    private function resolvePath(string $token): string {
        return self::STORAGE_PATH . '/' . $token . '.json';
    }
}
