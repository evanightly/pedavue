<?php

namespace App\Http\Controllers;

use App\Data\CourseInstructor\CourseInstructorData;
use App\Models\CourseInstructor;
use App\QueryFilters\DateRangeFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseInstructorController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = CourseInstructor::class;
    protected array $allowedFilters = ['course_id', 'created_at', 'instructor_id', 'updated_at'];
    protected array $allowedSorts = ['course_id', 'created_at', 'id', 'instructor_id', 'updated_at'];
    protected array $allowedIncludes = ['course', 'instructor'];
    protected array $defaultIncludes = ['course', 'instructor'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(CourseInstructor::class, 'course_instructor');
    }

    protected function filters(): array {
        return [
            'course_id',
            'instructor_id',
            DateRangeFilter::make('created_at'),
            DateRangeFilter::make('updated_at'),
        ];
    }

    public function index(Request $request): Response|JsonResponse {
        $filteredData = [];

        $query = $this->buildIndexQuery($request);

        $items = $query
            ->paginate($request->input('per_page'))
            ->appends($request->query());

        $courseInstructors = CourseInstructorData::collect($items);

        return $this->respond($request, 'course-instructor/index', [
            'courseInstructors' => $courseInstructors,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }

    public function create(): Response {
        return Inertia::render('course-instructor/create');
    }

    public function show(CourseInstructor $courseInstructor): Response {
        return Inertia::render('course-instructor/show', [
            'record' => CourseInstructorData::fromModel($courseInstructor)->toArray(),
        ]);
    }

    public function edit(CourseInstructor $courseInstructor): Response {
        return Inertia::render('course-instructor/edit', [
            'record' => CourseInstructorData::fromModel($courseInstructor)->toArray(),
        ]);
    }

    public function store(CourseInstructorData $courseInstructorData): RedirectResponse {
        $courseInstructor = CourseInstructor::create($courseInstructorData->toArray());

        return redirect()
            ->route('course-instructors.index', $courseInstructor)
            ->with('flash.success', 'CourseInstructor created.');
    }

    public function update(CourseInstructorData $courseInstructorData, CourseInstructor $courseInstructor): RedirectResponse {
        $courseInstructor->update($courseInstructorData->toArray());

        return redirect()
            ->route('course-instructors.index', $courseInstructor)
            ->with('flash.success', 'CourseInstructor updated.');
    }

    public function destroy(CourseInstructor $courseInstructor): RedirectResponse {
        $courseInstructor->delete();

        return redirect()
            ->route('course-instructors.index')
            ->with('flash.success', 'CourseInstructor deleted.');
    }

    public function bulkDelete(Request $request): JsonResponse {
        $this->authorize('deleteAny', CourseInstructor::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = CourseInstructor::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }
}
