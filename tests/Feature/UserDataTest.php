<?php

use App\Data\User\UserData;
use App\Models\Role;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('user data includes role and permissions', function () {
    $role = Role::factory()->create(['name' => 'Admin', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $userData = UserData::fromModel($user);

    expect($userData->role)->toBe('Admin')
        ->and($userData->permissions)->toBeArray();
});

test('user data works with super admin role', function () {
    $role = Role::factory()->create(['name' => 'SuperAdmin', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $userData = UserData::fromModel($user);

    expect($userData->role)->toBe('SuperAdmin')
        ->and($userData->permissions)->toBeArray();
});
