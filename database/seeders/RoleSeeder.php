<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Support\Enums\RoleEnum;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder {
    /**
     * Run the database seeds.
     */
    public function run(): void {
        foreach (RoleEnum::toArray() as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
    }
}
