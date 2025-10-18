<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder {
    /**
     * Run the database seeds.
     */
    public function run(): void {
        Role::whereName(RoleEnum::SuperAdmin)->first()->givePermissionTo(PermissionEnum::toArray());

        Role::whereName(RoleEnum::Instructor)->first()->givePermissionTo([
            PermissionEnum::ReadCourse,
            PermissionEnum::CreateCourse,
            PermissionEnum::UpdateCourse,
            PermissionEnum::DeleteCourse,
            PermissionEnum::ReadEnrollment,
            PermissionEnum::CreateEnrollment,
            PermissionEnum::UpdateEnrollment,
            PermissionEnum::DeleteEnrollment,
        ]);
    }
}
