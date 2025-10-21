<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CourseStudentProgressData extends Data {
    public function __construct(
        public int $student_id,
        public string $student_name,
        public ?string $student_email,
        public int $progress,
        public string $status,
    ) {}
}
