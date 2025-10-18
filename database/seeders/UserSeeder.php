<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Enums\RoleEnum;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder {
    /**
     * Run the database seeds.
     */
    public function run(): void {
        $superAdmin = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        $superAdmin->assignRole(RoleEnum::SuperAdmin);

        User::factory(5)->create();
    }
}
