<?php

use App\Models\Permission;
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

it('allows super admin to manage permissions', function (): void {
    $user = User::factory()->create();
    ensureRoleExists(RoleEnum::SuperAdmin);
    $user->assignRole(RoleEnum::SuperAdmin->value);

    $permission = createPermissionEnumRecord(PermissionEnum::DeletePermission);

    expect(Gate::forUser($user)->allows('delete', $permission))->toBeTrue();
});

it('allows users with matching permission to view permissions', function (): void {
    $user = User::factory()->create();

    createPermissionEnumRecord(PermissionEnum::ReadPermission);
    $user->givePermissionTo(PermissionEnum::ReadPermission->value);

    expect(Gate::forUser($user)->allows('viewAny', Permission::class))->toBeTrue();
});

it('denies users without the permission from viewing permissions', function (): void {
    $user = User::factory()->create();

    createPermissionEnumRecord(PermissionEnum::ReadPermission);

    expect(Gate::forUser($user)->allows('viewAny', Permission::class))->toBeFalse();
});
