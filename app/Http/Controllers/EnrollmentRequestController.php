<?php

namespace App\Http\Controllers;

use App\Data\EnrollmentRequest\EnrollmentRequestData;
use App\Models\EnrollmentRequest;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class EnrollmentRequestController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = EnrollmentRequest::class;
    protected array $allowedFilters = ['course_id', 'created_at', 'message', 'search', 'status', 'updated_at', 'user_id'];
    protected array $allowedSorts = ['course_id', 'created_at', 'id', 'message', 'status', 'updated_at', 'user_id'];
    protected array $allowedIncludes = ['course', 'user'];
    protected array $defaultIncludes = ['course', 'user'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(EnrollmentRequest::class, 'enrollment_request');
    }

    protected function filters(): array
    {
        return [
            'course_id',
            'message',
            'status',
            'user_id',
            MultiColumnSearchFilter::make(['message', 'status']),
            DateRangeFilter::make('created_at'),
            DateRangeFilter::make('updated_at'),
        ];
    }
    public function index(Request $request): Response|JsonResponse
    {
        $filteredData = [];

        $query = $this->buildIndexQuery($request);

        $items = $query
            ->paginate($request->input('per_page'))
            ->appends($request->query());

        $enrollmentRequests = EnrollmentRequestData::collect($items);

        return $this->respond($request, 'enrollment-request/index', [
            'enrollmentRequests' => $enrollmentRequests,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('enrollment-request/create');
    }
    public function show(EnrollmentRequest $enrollmentRequest): Response
    {
        return Inertia::render('enrollment-request/show', [
            'record' => EnrollmentRequestData::fromModel($enrollmentRequest)->toArray(),
        ]);
    }
    public function edit(EnrollmentRequest $enrollmentRequest): Response
    {
        return Inertia::render('enrollment-request/edit', [
            'record' => EnrollmentRequestData::fromModel($enrollmentRequest)->toArray(),
        ]);
    }
    public function store(EnrollmentRequestData $enrollmentRequestData): RedirectResponse
    {
        $enrollmentRequest = EnrollmentRequest::create($enrollmentRequestData->toArray());
        return redirect()
            ->route('enrollment-requests.index', $enrollmentRequest)
            ->with('flash.success', 'EnrollmentRequest created.');
    }
    public function update(EnrollmentRequestData $enrollmentRequestData, EnrollmentRequest $enrollmentRequest): RedirectResponse
    {
        $enrollmentRequest->update($enrollmentRequestData->toArray());
        return redirect()
            ->route('enrollment-requests.index', $enrollmentRequest)
            ->with('flash.success', 'EnrollmentRequest updated.');
    }
    public function destroy(EnrollmentRequest $enrollmentRequest): RedirectResponse
    {
        $enrollmentRequest->delete();
        return redirect()
            ->route('enrollment-requests.index')
            ->with('flash.success', 'EnrollmentRequest deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', EnrollmentRequest::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = EnrollmentRequest::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
