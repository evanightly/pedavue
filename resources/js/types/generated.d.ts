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
        students: App.Data.User.UserData[] | null;
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
declare namespace App.Data.EnrollmentRequest {
    export type EnrollmentRequestData = {
        id: any | number;
        message: string | null;
        status: string | null;
        course_id: number | null;
        user_id: number | null;
        course_title: string | null;
        user_name: string | null;
        created_at: string | null;
        updated_at: string | null;
        created_at_formatted: string | null;
        updated_at_formatted: string | null;
        enrollment_created_at_formatted: string | null;
        user_created_at_formatted: string | null;
        user: App.Data.User.UserData | null;
        course: App.Data.Course.CourseData | null;
    };
}
declare namespace App.Data.Module {
    export type ModuleData = {
        id: any | number;
        title: string | null;
        description: string | null;
        thumbnail: string | null;
        duration: number | null;
        order: number | null;
        created_at: string | null;
        updated_at: string | null;
        course: any;
        module_stages: App.Data.ModuleStage.ModuleStageData[] | null;
    };
}
declare namespace App.Data.ModuleContent {
    export type ModuleContentData = {
        id: any | number;
        title: string | null;
        description: string | null;
        file_path: string | null;
        content_url: string | null;
        file_url: string | null;
        duration: number | null;
        content_type: string | null;
        created_at: string | null;
        updated_at: string | null;
        module_stage: any;
    };
}
declare namespace App.Data.ModuleStage {
    export type ModuleStageData = {
        id: any | number;
        module_able: string | null;
        order: number | null;
        created_at: string | null;
        updated_at: string | null;
        module: any;
        module_content: any;
        module_quiz: any;
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
declare namespace App.Data.QuizImport {
    export type QuizImportOptionPreviewData = {
        label: any | string;
        option_text: string | null;
        is_correct: boolean;
        has_image: boolean;
        image_preview: string | null;
    };
    export type QuizImportPreviewData = {
        token: string;
        imported_count: number;
        existing_count: number;
        incomingQuestions: App.Data.QuizImport.QuizImportQuestionPreviewData[];
        existingQuestions: App.Data.QuizImport.QuizImportQuestionPreviewData[] | null;
        warnings: Array<any>;
        quiz: App.Data.Quiz.QuizData;
    };
    export type QuizImportQuestionPreviewData = {
        label: string;
        question: string | null;
        has_image: boolean;
        image_preview: string | null;
        options: any;
    };
}
declare namespace App.Data.QuizQuestion {
    export type QuizQuestionData = {
        id: any | number;
        quiz_id: number | null;
        question: string | null;
        question_image: string | null;
        question_image_url: string | null;
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
        option_image: string | null;
        option_image_url: string | null;
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
    export enum EnrollmentRequestEnum {
        Pending = 'Pending',
        Approved = 'Approved',
        Rejected = 'Rejected',
    }
    export enum PermissionEnum {
        ReadUser = 'ReadUser',
        CreateUser = 'CreateUser',
        UpdateUser = 'UpdateUser',
        DeleteUser = 'DeleteUser',
        ReadRole = 'ReadRole',
        CreateRole = 'CreateRole',
        UpdateRole = 'UpdateRole',
        DeleteRole = 'DeleteRole',
        ReadPermission = 'ReadPermission',
        CreatePermission = 'CreatePermission',
        UpdatePermission = 'UpdatePermission',
        DeletePermission = 'DeletePermission',
        ReadCourse = 'ReadCourse',
        CreateCourse = 'CreateCourse',
        UpdateCourse = 'UpdateCourse',
        DeleteCourse = 'DeleteCourse',
        ReadEnrollment = 'ReadEnrollment',
        CreateEnrollment = 'CreateEnrollment',
        UpdateEnrollment = 'UpdateEnrollment',
        DeleteEnrollment = 'DeleteEnrollment',
    }
    export enum RoleEnum {
        SuperAdmin = 'SuperAdmin',
        Admin = 'Admin',
        Instructor = 'Instructor',
        Student = 'Student',
    }
}
