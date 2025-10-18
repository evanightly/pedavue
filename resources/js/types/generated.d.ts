declare namespace App.Data.Course {
    export type CourseData = {
        id: any | number;
        instructor_ids: number[] | null;
        title: string | null;
        slug: any | string;
        description: string | null;
        certification_enabled: any | boolean;
        thumbnail: string | null;
        thumbnail_url: string | null;
        level: string | null;
        duration: string | null;
        duration_formatted: string | null;
        certificate_template: string | null;
        certificate_template_url: string | null;
        certificate_name_position_x: number | null;
        certificate_name_position_y: number | null;
        certificate_name_max_length: number | null;
        certificate_name_box_width: number | null;
        certificate_name_box_height: number | null;
        certificate_name_font_family: string | null;
        certificate_name_font_weight: string | null;
        certificate_name_text_align: string | null;
        certificate_name_text_color: string | null;
        certificate_name_letter_spacing: number | null;
        certificate_example: string | null;
        certificate_example_url: string | null;
        created_at: string | null;
        created_at_formatted: string | null;
        updated_at: string | null;
        updated_at_formatted: string | null;
        course_instructors: App.Data.User.UserData[] | null;
    };
}
declare namespace App.Data.CourseInstructor {
    export type CourseInstructorData = {
        id: any | number;
        created_at: string | null;
        updated_at: string | null;
        instructor: any;
        course: any;
    };
}
declare namespace App.Data.Enrollment {
    export type EnrollmentData = {
        id: any | number;
        progress: number | null;
        completed_at: string | null;
        created_at: string | null;
        updated_at: string | null;
        user: any;
        course: any;
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
declare namespace App.Data.Quiz {
    export type QuizData = {
        id: any | number;
        name: string | null;
        description: string | null;
        duration: number | null;
        is_question_shuffled: boolean;
        type: string | null;
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
        is_answer_shuffled: boolean;
        order: number;
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
        order: number;
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
        avatar: string | null;
        avatar_url: string | null;
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
