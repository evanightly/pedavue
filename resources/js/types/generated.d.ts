declare namespace App.Data.User {
    export type UserData = {
        id: any | number;
        name: string | null;
        email: string | null;
        password: string | null;
        created_at: string | null;
        updated_at: string | null;
    };
}
declare namespace App.Support.Enums {
    export type PermissionEnum = 'ReadUser' | 'CreateUser' | 'UpdateUser' | 'DeleteUser';
    export type RoleEnum = 'SuperAdmin' | 'Admin' | 'Instructor' | 'Student';
}
