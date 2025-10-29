declare namespace App.Data.Course {
    export type CourseCertificateImageData = {
        id: number;
        file_path: string;
        file_url: string;
        position_x: number;
        position_y: number;
        width: number;
        height: number;
        z_index: number;
        label: string | null;
    };
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
        total_quiz_points: number | null;
        certificate_template: string | null;
        certificate_template_url: string | null;
        certificate_required_points: number | null;
        certificate_required_points_effective: number | null;
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
        certificate_qr_position_x: number | null;
        certificate_qr_position_y: number | null;
        certificate_qr_box_width: number | null;
        certificate_qr_box_height: number | null;
        certificate_example: string | null;
        certificate_example_url: string | null;
        created_at: string | null;
        created_at_formatted: string | null;
        updated_at: string | null;
        updated_at_formatted: string | null;
        course_instructors: App.Data.User.UserData[] | null;
        students: App.Data.User.UserData[] | null;
        certificate_images: App.Data.Course.CourseCertificateImageData[] | null;
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
declare namespace App.Data.Dashboard {
    export type ChartDistributionData = {
        title: string;
        description: string | null;
        segments: any;
        meta: Array<any>;
    };
    export type ChartSegmentData = {
        key: string;
        label: string;
        value: number;
        color: string | null;
    };
    export type CourseProgressSummaryData = {
        course_id: number;
        course_title: string;
        total_students: number;
        completed_count: number;
        in_progress_count: number;
        not_started_count: number;
        students: any;
    };
    export type CourseStudentProgressData = {
        student_id: number;
        student_name: string;
        student_email: string | null;
        progress: number;
        status: string;
    };
    export type DashboardData = {
        user: any;
        role_names: string[];
        super_admin: any;
        instructor: any;
        student: any;
        filters: Array<any>;
    };
    export type InstructorDashboardData = {
        course_progress: any;
        unique_students: number;
        filters: Array<any>;
    };
    export type StudentDashboardData = {
        recent_progress: any;
        completed_count: number;
        in_progress_count: number;
        pending_count: number;
        filters: Array<any>;
    };
    export type SuperAdminDashboardData = {
        user_roles: App.Data.Dashboard.ChartDistributionData;
        course_levels: App.Data.Dashboard.ChartDistributionData;
        filters: Array<any>;
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
        module_id: number | null;
        module_able: string | null;
        module_able_type: string | null;
        module_able_id: number | null;
        order: number | null;
        created_at: string | null;
        updated_at: string | null;
        module: any;
        module_content: any;
        module_quiz: any;
    };
}
declare namespace App.Data.ModuleStageProgress {
    export type ModuleStageProgressData = {
        id: any | number;
        status: string | null;
        started_at: string | null;
        completed_at: string | null;
        state: Array<any>;
        module_stage: any;
        enrollment: any;
        updated_at: string | null;
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
        is_question_shuffled: any | boolean;
        type: string | null;
        total_points: number | null;
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
        question: string;
        question_image: string | null;
        question_image_url: string | null;
        is_answer_shuffled: any | boolean;
        order: number | null;
        points: number | null;
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
        option_text: string;
        option_image: string | null;
        option_image_url: string | null;
        is_correct: any | boolean;
        order: number | null;
        quiz_question: App.Data.QuizQuestion.QuizQuestionData | null;
        created_at: string | null;
        updated_at: string | null;
    };
}
declare namespace App.Data.QuizResponse {
    export type QuizResponseData = {
        id: any | number;
        quiz_id: number | null;
        user_id: number | null;
        attempt: number | null;
        score: number | null;
        started_at: string | null;
        finished_at: string | null;
        quiz: App.Data.Quiz.QuizData | null;
        user: App.Data.User.UserData | null;
        quiz_response_answers: App.Data.QuizResponseAnswer.QuizResponseAnswerData[] | null;
        created_at: string | null;
        updated_at: string | null;
    };
}
declare namespace App.Data.QuizResponseAnswer {
    export type QuizResponseAnswerData = {
        id: any | number;
        quiz_response_id: number | null;
        quiz_question_id: number | null;
        quiz_question_option_id: number | null;
        started_at: string | null;
        finished_at: string | null;
        quiz_response: App.Data.QuizResponse.QuizResponseData | null;
        quiz_question: App.Data.QuizQuestion.QuizQuestionData | null;
        quiz_question_option: App.Data.QuizQuestionOption.QuizQuestionOptionData | null;
        created_at: string | null;
        updated_at: string | null;
    };
}
declare namespace App.Data.QuizResult {
    export type QuizResultData = {
        id: any | number;
        score: number | null;
        earned_points: number | null;
        total_points: number | null;
        attempt: number | null;
        started_at: string | null;
        finished_at: string | null;
        created_at: string | null;
        updated_at: string | null;
        user: any;
        quiz: any;
    };
}
declare namespace App.Data.QuizResultAnswer {
    export type QuizResultAnswerData = {
        id: any | number;
        user_answer_text: string | null;
        started_at: string | null;
        finished_at: string | null;
        created_at: string | null;
        updated_at: string | null;
        quiz_result: any;
        question: any;
        answer: any;
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
    export enum ModuleStageProgressStatus {
        Pending = 'pending',
        InProgress = 'in_progress',
        Completed = 'completed',
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
