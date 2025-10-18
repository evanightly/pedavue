<?php

namespace App\Http\Controllers;

use App\Data\Enrollment\EnrollmentData;
use App\Models\Enrollment;
use App\QueryFilters\DateRangeFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = Enrollment::class;
    protected array $allowedFilters = ['completed_at', 'course_id', 'created_at', 'progress', 'updated_at', 'user_id'];
    protected array $allowedSorts = ['completed_at', 'course_id', 'created_at', 'id', 'progress', 'updated_at', 'user_id'];
    protected array $allowedIncludes = ['course', 'user'];
    protected array $defaultIncludes = ['course', 'user'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(Enrollment::class, 'enrollment');
    }

    protected function filters(): array {
        return [
            'course_id',
            'progress',
            'user_id',
            DateRangeFilter::make('completed_at'),
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

        $enrollments = EnrollmentData::collect($items);

        return $this->respond($request, 'enrollment/index', [
            'enrollments' => $enrollments,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }

    public function create(): Response {
        return Inertia::render('enrollment/create');
    }

    public function show(Enrollment $enrollment): Response {
        return Inertia::render('enrollment/show', [
            'record' => EnrollmentData::fromModel($enrollment)->toArray(),
        ]);
    }

    public function edit(Enrollment $enrollment): Response {
        return Inertia::render('enrollment/edit', [
            'record' => EnrollmentData::fromModel($enrollment)->toArray(),
        ]);
    }

    public function store(EnrollmentData $enrollmentData): RedirectResponse {
        $enrollment = Enrollment::create($enrollmentData->toArray());

        return redirect()
            ->route('enrollments.index', $enrollment)
            ->with('flash.success', 'Enrollment created.');
    }

    public function update(EnrollmentData $enrollmentData, Enrollment $enrollment): RedirectResponse {
        $enrollment->update($enrollmentData->toArray());

        return redirect()
            ->route('enrollments.index', $enrollment)
            ->with('flash.success', 'Enrollment updated.');
    }

    public function destroy(Enrollment $enrollment): RedirectResponse {
        $enrollment->delete();

        return redirect()
            ->route('enrollments.index')
            ->with('flash.success', 'Enrollment deleted.');
    }

    public function bulkDelete(Request $request): JsonResponse {
        $this->authorize('deleteAny', Enrollment::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = Enrollment::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }
}
