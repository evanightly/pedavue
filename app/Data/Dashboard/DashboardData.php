<?php

namespace App\Data\Dashboard;

use App\Data\User\UserData;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class DashboardData extends Data {
    /**
     * @param  list<string>  $role_names
     * @param  array<string, mixed>  $filters
     */
    public function __construct(
        #[TypeScriptType('App.Data.User.UserData | null')]
        public ?UserData $user,
        #[LiteralTypeScriptType('string[]')]
        public array $role_names,
        #[TypeScriptType('App.Data.Dashboard.SuperAdminDashboardData | null')]
        public ?SuperAdminDashboardData $super_admin,
        #[TypeScriptType('App.Data.Dashboard.InstructorDashboardData | null')]
        public ?InstructorDashboardData $instructor,
        #[TypeScriptType('App.Data.Dashboard.StudentDashboardData | null')]
        public ?StudentDashboardData $student,
        public array $filters,
    ) {}
}
