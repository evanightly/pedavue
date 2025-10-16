import { usePage } from '@inertiajs/react';

type Permission = App.Support.Enums.PermissionEnum;
type Role = App.Support.Enums.RoleEnum;

export const checkPermissions = (permissions: Permission | Permission[] | Role | Role[], strict: boolean = false): boolean => {
    const { auth } = usePage().props;

    if (!auth?.user) {
        return false;
    }

    const { user } = auth;

    if (user.role === App.Support.Enums.RoleEnum.SuperAdmin) {
        return true;
    }

    if (Array.isArray(permissions)) {
        return strict
            ? permissions.every((permission) => user.permissions.includes(permission as Permission) || user.role === permission)
            : permissions.some((permission) => user.permissions.includes(permission as Permission) || user.role === permission);
    }

    return user.permissions.includes(permissions as Permission) || user.role === permissions;
};
