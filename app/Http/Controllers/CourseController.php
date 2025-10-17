<?php

namespace App\Http\Controllers;

use App\Data\Course\CourseData;
use App\Models\Course;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = Course::class;
    protected array $allowedFilters = ['certification_enabled', 'created_at', 'description', 'duration', 'instructor_id', 'level', 'search', 'slug', 'thumbnail', 'title', 'updated_at'];
    protected array $allowedSorts = ['certification_enabled', 'created_at', 'description', 'duration', 'id', 'instructor_id', 'level', 'slug', 'thumbnail', 'title', 'updated_at'];
    protected array $allowedIncludes = ['Certificates', 'Enrollments', 'instructor', 'Modules', 'Quizzes'];
    protected array $defaultIncludes = ['instructor'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(Course::class, 'course');
    }

    protected function filters(): array {
        return [
            'certification_enabled',
            'description',
            'duration',
            'instructor_id',
            'level',
            'slug',
            'thumbnail',
            'title',
            MultiColumnSearchFilter::make(['description', 'duration', 'level', 'slug', 'thumbnail', 'title']),
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

        $courses = CourseData::collect($items);

        return $this->respond($request, 'course/index', [
            'courses' => $courses,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }

    public function create(): Response {
        return Inertia::render('course/create');
    }

    public function show(Course $course): Response {
        return Inertia::render('course/show', [
            'record' => CourseData::fromModel($course->load('instructor'))->toArray(),
        ]);
    }

    public function edit(Course $course): Response {
        return Inertia::render('course/edit', [
            'record' => CourseData::fromModel($course)->toArray(),
        ]);
    }

    public function store(CourseData $courseData): RedirectResponse {
        $data = $courseData->toArray();

        // Handle thumbnail file upload
        if (request()->hasFile('thumbnail')) {
            $file = request()->file('thumbnail');
            $path = $file->store('courses/thumbnails', 'public');
            $data['thumbnail'] = $path;
        }

        $course = Course::create($data);

        return redirect()
            ->route('courses.index', $course)
            ->with('flash.success', 'Course created.');
    }

    public function update(CourseData $courseData, Course $course): RedirectResponse {
        $data = $courseData->toArray();

        // Handle thumbnail file upload
        if (request()->hasFile('thumbnail')) {
            // Delete old thumbnail if exists
            if ($course->thumbnail && Storage::disk('public')->exists($course->thumbnail)) {
                Storage::disk('public')->delete($course->thumbnail);
            }

            $file = request()->file('thumbnail');
            $path = $file->store('courses/thumbnails', 'public');
            $data['thumbnail'] = $path;
        }

        $course->update($data);

        return redirect()
            ->route('courses.index', $course)
            ->with('flash.success', 'Course updated.');
    }

    public function destroy(Course $course): RedirectResponse {
        $course->delete();

        return redirect()
            ->route('courses.index')
            ->with('flash.success', 'Course deleted.');
    }

    public function bulkDelete(Request $request): JsonResponse {
        $this->authorize('deleteAny', Course::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = Course::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }
}
