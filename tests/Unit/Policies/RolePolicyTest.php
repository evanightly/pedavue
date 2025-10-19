<?php

use App\Models\Role;
use App\Models\User;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\PermissionRegistrar;

uses(Tests\TestCase::class, RefreshDatabase::class);

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

it('allows super admin to manage roles', function (): void {
    $user = User::factory()->create();
    ensureRoleExists(RoleEnum::SuperAdmin);
    $user->assignRole(RoleEnum::SuperAdmin->value);

    $managedRole = ensureRoleExists(RoleEnum::Instructor);

    expect(Gate::forUser($user)->allows('delete', $managedRole))->toBeTrue();
});

it('allows users with matching permission to view roles', function (): void {
    $user = User::factory()->create();

    createPermissionEnumRecord(PermissionEnum::ReadRole);
    $user->givePermissionTo(PermissionEnum::ReadRole->value);

    expect(Gate::forUser($user)->allows('viewAny', Role::class))->toBeTrue();
});

it('denies users without the permission from updating roles', function (): void {
    $user = User::factory()->create();

    createPermissionEnumRecord(PermissionEnum::UpdateRole);
    $role = ensureRoleExists(RoleEnum::Admin);

    expect(Gate::forUser($user)->allows('update', $role))->toBeFalse();
});
