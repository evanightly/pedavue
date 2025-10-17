declare namespace App.Data.Course {
    export type CourseData = {
        id: any | number;
        instructor_id: any | number;
        title: string | null;
        slug: string;
        description: string | null;
        certification_enabled: any | boolean;
        thumbnail: string | null;
        level: string | null;
        duration: string | null;
        created_at: string | null;
        updated_at: string | null;
        instructor: any;
    };
}
declare namespace App.Data.Permission {
    export type PermissionData = {
        id: any | number;
        name: string | null;
        guard_name: string | null;
        group: string | null;
        created_at: string | null;
        updated_at: string | null;
    };
}
declare namespace App.Data.Role {
    export type RoleData = {
        id: any | number;
        name: string | null;
        guard_name: string | null;
        permissions: App.Data.Permission.PermissionData[] | null;
        permissionIds: number[] | null;
        created_at: string | null;
        updated_at: string | null;
    };
}
declare namespace App.Data.User {
    export type UserData = {
        id: any | number;
        name: string | null;
        email: string | null;
        password: string | null;
        role: string | null;
        permissions: string[] | null;
        roles: App.Data.Role.RoleData[] | null;
        roleIds: number[] | null;
        created_at: string | null;
        updated_at: string | null;
    };
}
declare namespace App.Support.Enums {
    export enum PermissionEnum {
        ReadUser = 'ReadUser',
        CreateUser = 'CreateUser',
        UpdateUser = 'UpdateUser',
        DeleteUser = 'DeleteUser',
    }
    export enum RoleEnum {
        SuperAdmin = 'SuperAdmin',
        Admin = 'Admin',
        Instructor = 'Instructor',
        Student = 'Student',
    }
}
