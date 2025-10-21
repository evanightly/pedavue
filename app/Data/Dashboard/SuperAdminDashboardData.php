<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class SuperAdminDashboardData extends Data {
    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(
        public ChartDistributionData $user_roles,
        public ChartDistributionData $course_levels,
        public array $filters,
    ) {}
}
