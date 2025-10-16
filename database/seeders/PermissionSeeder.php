<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Support\Enums\PermissionEnum;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder {
    /**
     * Run the database seeds.
     */
    public function run(): void {
        foreach (PermissionEnum::toArray() as $permission) {
            Permission::create([
                'name' => $permission,
            ]);
        }
    }
}
