<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Permission>
 */
class PermissionFactory extends Factory {
    /**
     * @return array<string, mixed>
     */
    public function definition(): array {
        return [
            'name' => fake()->word(),
            'guard_name' => fake()->word(),
            'group' => fake()->word(),
        ];
    }
}
