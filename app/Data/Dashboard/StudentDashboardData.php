<?php

namespace App\Data\Dashboard;

use App\Data\ModuleStageProgress\ModuleStageProgressData;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class StudentDashboardData extends Data {
    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(
        #[DataCollectionOf(ModuleStageProgressData::class)]
        public DataCollection $recent_progress,
        public int $completed_count,
        public int $in_progress_count,
        public int $pending_count,
        public array $filters,
    ) {}
}
