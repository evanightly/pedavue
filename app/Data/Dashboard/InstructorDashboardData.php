<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class InstructorDashboardData extends Data {
    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(
        #[DataCollectionOf(CourseProgressSummaryData::class)]
        public DataCollection $course_progress,
        public int $unique_students,
        public array $filters,
    ) {}
}
