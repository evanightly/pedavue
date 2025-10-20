<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Support\WorkspaceProgressManager;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseWorkspaceController extends Controller {
    use AuthorizesRequests;

    public function __construct(private WorkspaceProgressManager $progressManager) {}

    public function show(Request $request, Course $course): Response {
        $this->authorize('accessWorkspace', $course);

        $user = $request->user();

        $enrollment = $this->progressManager->getEnrollmentFor($user, $course);
        $overview = $this->progressManager->buildOverview($enrollment);

        $this->progressManager->syncEnrollmentProgress($enrollment, $overview);
        $enrollment->refresh();

        $courseData = [
            'id' => $course->getKey(),
            'title' => $course->title,
            'description' => $course->description,
            'slug' => $course->slug,
            'thumbnail_url' => $course->thumbnail ? asset('storage/' . ltrim($course->thumbnail, '/')) : null,
        ];

        $enrollmentData = [
            'id' => $enrollment->getKey(),
            'progress' => $enrollment->progress,
            'progress_label' => $enrollment->progress . '%',
            'completed_at' => $enrollment->completed_at?->toIso8601String(),
        ];

        return Inertia::render('workspace/course/show', [
            'course' => $courseData,
            'enrollment' => $enrollmentData,
            'modules' => $overview['modules'],
            'stats' => $overview['stats'],
            'currentStageId' => $overview['current_stage_id'],
        ]);
    }
}
