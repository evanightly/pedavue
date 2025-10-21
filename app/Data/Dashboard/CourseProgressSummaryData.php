<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CourseProgressSummaryData extends Data {
    public function __construct(
        public int $course_id,
        public string $course_title,
        public int $total_students,
        public int $completed_count,
        public int $in_progress_count,
        public int $not_started_count,
        #[DataCollectionOf(CourseStudentProgressData::class)]
        public DataCollection $students,
    ) {}
}
