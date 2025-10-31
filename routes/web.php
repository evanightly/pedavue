<?php

use App\Http\Controllers\CertificateVerificationController;
use App\Http\Controllers\CourseCertificateController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseInstructorController;
use App\Http\Controllers\CourseModuleContentController;
use App\Http\Controllers\CourseModuleController;
use App\Http\Controllers\CourseWorkspaceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\EnrollmentRequestController;
use App\Http\Controllers\ModuleContentController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\ModuleStageController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuizImportController;
use App\Http\Controllers\QuizResponseAnswerController;
use App\Http\Controllers\QuizResponseController;
use App\Http\Controllers\QuizResultAnswerController;
use App\Http\Controllers\QuizResultController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkspaceModuleStageController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('explore-course', [CourseController::class, 'explore'])->name('courses.explore');
Route::get('certificates/verify/{course}/{enrollment}', [CertificateVerificationController::class, 'show'])
    ->middleware('signed')
    ->name('certificates.verify');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('dashboard', DashboardController::class);
    Route::resource('users', UserController::class);
    Route::resource('permissions', PermissionController::class);
    Route::resource('quizzes', QuizController::class);

    // Quiz management extensions from both branches
    // 1) Init / questions / add / import-questions (feature branch)
    // Route::post('quizzes/init-questions', [QuizController::class, 'initQuestions'])->name('quizzes.init.questions');
    Route::group(['prefix' => 'quizzes/{quiz}', 'as' => 'quizzes.'], function () {
        Route::get('questions', [QuizController::class, 'questions'])->name('questions');
        Route::post('questions', [QuizController::class, 'addQuestion'])->name('questions.add');
        Route::post('import-questions', [QuizController::class, 'importQuestions'])->name('import.questions');
    });

    // 2) Import flow (origin/main)
    Route::get('quizzes/import/template', [QuizImportController::class, 'template'])->name('quizzes.import.template');
    Route::get('quizzes/{quiz}/import', [QuizImportController::class, 'show'])->name('quizzes.import.show');
    Route::match(['get', 'post'], 'quizzes/{quiz}/import/preview', [QuizImportController::class, 'preview'])->name('quizzes.import.preview');
    Route::post('quizzes/{quiz}/import/confirm', [QuizImportController::class, 'confirm'])->name('quizzes.import.confirm');

    // Quiz response related resources
    Route::resource('quiz-questions', QuizResponseController::class);
    Route::resource('quiz-responses', QuizResponseController::class);
    Route::resource('quiz-response-answers', QuizResponseAnswerController::class);
    Route::resource('roles', RoleController::class);
    Route::resource('courses', CourseController::class)->except(['show']);
    Route::post('courses/{course}/instructors', [CourseController::class, 'attachInstructor'])->name('courses.instructors.attach');
    Route::delete('courses/{course}/instructors/{instructor}', [CourseController::class, 'detachInstructor'])->name('courses.instructors.detach');
    Route::get('courses/{course}/students', [CourseController::class, 'students'])->name('courses.students.index');
    Route::post('courses/{course}/students', [CourseController::class, 'assignStudents'])->name('courses.students.store');
    Route::delete('courses/{course}/students/{student}', [CourseController::class, 'unassignStudent'])->name('courses.students.destroy');
    Route::post('courses/{course}/enrollment-request', [CourseController::class, 'requestEnrollment'])->name('courses.enrollment-request.store');
    Route::resource('course-instructors', CourseInstructorController::class);
    Route::resource('enrollments', EnrollmentController::class);
    Route::resource('enrollment-requests', EnrollmentRequestController::class);
    Route::patch('enrollment-requests/{enrollment_request}/approve', [EnrollmentRequestController::class, 'approve'])->name('enrollment-requests.approve');
    Route::patch('enrollment-requests/{enrollment_request}/reject', [EnrollmentRequestController::class, 'reject'])->name('enrollment-requests.reject');

    Route::scopeBindings()->group(function () {
        Route::prefix('courses/{course}')->group(function () {
            Route::get('modules/create', [CourseModuleController::class, 'create'])->name('courses.modules.create');
            Route::post('modules', [CourseModuleController::class, 'store'])->name('courses.modules.store');
            Route::get('modules/{module}/contents', [CourseModuleContentController::class, 'index'])->name('courses.modules.contents.index');
            Route::post('modules/{module}/contents', [CourseModuleContentController::class, 'store'])->name('courses.modules.contents.store');
            Route::patch('modules/{module}/contents/reorder', [CourseModuleContentController::class, 'reorder'])->name('courses.modules.contents.reorder');
            Route::patch('modules/{module}/contents/{stage}', [CourseModuleContentController::class, 'update'])->name('courses.modules.contents.update');
            Route::delete('modules/{module}/contents/{stage}', [CourseModuleContentController::class, 'destroy'])->name('courses.modules.contents.destroy');

            Route::get('workspace', [CourseWorkspaceController::class, 'show'])->name('courses.workspace.show');

            Route::prefix('workspace')->group(function () {
                Route::get('certificate', [CourseCertificateController::class, 'download'])->name('courses.workspace.certificate.download');
                Route::get('modules/{module}/stages/{module_stage}', [WorkspaceModuleStageController::class, 'show'])->name('courses.workspace.stages.show');
                Route::post('modules/{module}/stages/{module_stage}/complete', [WorkspaceModuleStageController::class, 'complete'])->name('courses.workspace.stages.complete');
                Route::post('modules/{module}/stages/{module_stage}/quiz/progress', [WorkspaceModuleStageController::class, 'saveQuizProgress'])->name('courses.workspace.stages.quiz.progress');
                Route::post('modules/{module}/stages/{module_stage}/quiz/submit', [WorkspaceModuleStageController::class, 'submitQuiz'])->name('courses.workspace.stages.quiz.submit');
            });
        });
    });
});

Route::get('courses/{course}', [CourseController::class, 'show'])->name('courses.show');
Route::get('csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

Route::resource('modules', ModuleController::class);

Route::resource('module-contents', ModuleContentController::class);
Route::get('module-content/videos', [ModuleContentController::class, 'videos'])->name('module-contents.videos');
Route::get('module-content/videos/{module_content}', [ModuleContentController::class, 'videoShow'])->name('module-contents.videos.show');

Route::resource('module-stages', ModuleStageController::class);

Route::resource('quiz-results', QuizResultController::class);

Route::resource('quiz-result-answers', QuizResultAnswerController::class);

// Video scenes and interactions
Route::resource('video-scenes', App\Http\Controllers\VideoSceneController::class);
Route::resource('scene-interactions', App\Http\Controllers\SceneInteractionController::class);

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
