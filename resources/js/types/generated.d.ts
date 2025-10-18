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
declare namespace App.Data.Quiz {
    export type QuizData = {
        id: any | number;
        name: string | null;
        description: string | null;
        duration: number | null;
        quiz_questions: App.Data.QuizQuestion.QuizQuestionData[] | null;
        created_at: string | null;
        updated_at: string | null;
    };
}
declare namespace App.Data.QuizQuestion {
    export type QuizQuestionData = {
        id: any | number;
        quiz_id: number | null;
        question: string | null;
        quiz: App.Data.Quiz.QuizData | null;
        quiz_question_options: App.Data.QuizQuestionOption.QuizQuestionOptionData[] | null;
        created_at: string | null;
        updated_at: string | null;
    };
}
declare namespace App.Data.QuizQuestionOption {
    export type QuizQuestionOptionData = {
        id: any | number;
        quiz_question_id: number | null;
        option_text: string | null;
        is_correct: boolean | null;
        quiz_question: App.Data.QuizQuestion.QuizQuestionData | null;
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
