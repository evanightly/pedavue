<?php

namespace App\Support\QuizImport;

/**
 * @internal
 *
 * @phpstan-type QuizImportImage array{data:string,mime_type:string,extension:string,original_name:string}
 * @phpstan-type QuizImportOption array{option_text:?string,is_correct:bool,image:?QuizImportImage}
 * @phpstan-type QuizImportQuestion array{question:?string,image:?QuizImportImage,options:array<int,QuizImportOption>}
 */
class QuizImportParseResult {
    /**
     * @param  array<int, array{question:?string,image:?array{data:string,mime_type:string,extension:string,original_name:string},options:array<int, array{option_text:?string,is_correct:bool,image:?array{data:string,mime_type:string,extension:string,original_name:string}}>}  $questions
     * @param  array<int, string>  $warnings
     * @param  array<string, string>  $errors
     */
    public function __construct(
        private array $questions,
        private array $warnings = [],
        private array $errors = [],
    ) {}

    /**
     * @return array<int, array{question:?string,image:?array{data:string,mime_type:string,extension:string,original_name:string},options:array<int, array{option_text:?string,is_correct:bool,image:?array{data:string,mime_type:string,extension:string,original_name:string}}>}>
     */
    public function questions(): array {
        return $this->questions;
    }

    /**
     * @return array<int, string>
     */
    public function warnings(): array {
        return $this->warnings;
    }

    /**
     * @return array<string, string>
     */
    public function errors(): array {
        return $this->errors;
    }

    public function hasErrors(): bool {
        return !empty($this->errors);
    }
}
