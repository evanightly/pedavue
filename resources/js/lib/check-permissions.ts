import { SharedData } from '@/types';
import { PermissionEnum, RoleEnum } from '@/types/enums.generated';
import { usePage } from '@inertiajs/react';

type PermissionCandidate = PermissionEnum | RoleEnum;

const collectRoleNames = (user: SharedData['auth']['user']): RoleEnum[] => {
    const roleNames = new Set<RoleEnum>();

    if (user.role) {
        roleNames.add(user.role as RoleEnum);
    }

    if (Array.isArray(user.roles)) {
        user.roles.forEach((role) => {
            if (role?.name) {
                roleNames.add(role.name as RoleEnum);
            }
        });
    }

    return Array.from(roleNames);
};

const collectPermissionNames = (user: SharedData['auth']['user']): PermissionEnum[] => {
    const permissionNames = new Set<PermissionEnum>();

    if (Array.isArray(user.permissions)) {
        user.permissions.forEach((permission) => {
            permissionNames.add(permission as PermissionEnum);
        });
    }

    if (Array.isArray(user.roles)) {
        user.roles.forEach((role) => {
            if (Array.isArray(role?.permissions)) {
                role.permissions.forEach((permission) => {
                    if (permission?.name) {
                        permissionNames.add(permission.name as PermissionEnum);
                    }
                });
            }
        });
    }

    return Array.from(permissionNames);
};

export const checkPermissions = (permissions: PermissionCandidate | PermissionCandidate[], strict: boolean = false): boolean => {
    const { auth } = usePage<SharedData>().props;

    if (!auth?.user) {
        return false;
    }

    const { user } = auth;
    const roleNames = collectRoleNames(user);
    const permissionNames = collectPermissionNames(user);

    if (roleNames.includes(RoleEnum.SuperAdmin)) {
        return true;
    }

    const hasAccess = (candidate: PermissionCandidate): boolean => {
        return roleNames.includes(candidate as RoleEnum) || permissionNames.includes(candidate as PermissionEnum);
    };

    if (Array.isArray(permissions)) {
        return permissions.length === 0 ? false : strict ? permissions.every(hasAccess) : permissions.some(hasAccess);
    }

    return hasAccess(permissions);
};
