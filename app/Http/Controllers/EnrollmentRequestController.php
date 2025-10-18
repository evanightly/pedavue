<?php

namespace App\Http\Controllers;

use App\Data\EnrollmentRequest\EnrollmentRequestData;
use App\Models\Enrollment;
use App\Models\EnrollmentRequest;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use App\Support\Enums\EnrollmentRequestEnum;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentRequestController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = EnrollmentRequest::class;
    protected array $allowedFilters = ['course_id', 'created_at', 'message', 'search', 'status', 'updated_at', 'user_id'];
    protected array $allowedSorts = ['course_id', 'created_at', 'id', 'message', 'status', 'updated_at', 'user_id'];
    protected array $allowedIncludes = ['course', 'user'];
    protected array $defaultIncludes = ['course', 'user'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(EnrollmentRequest::class, 'enrollment_request');
    }

    protected function filters(): array {
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

    public function index(Request $request): Response|JsonResponse {
        $filteredData = [];

        $query = $this->buildIndexQuery($request);

        $user = $request->user();

        if ($user && !$user->hasRole(RoleEnum::SuperAdmin->value)) {
            if ($user->hasRole(RoleEnum::Student->value)) {
                $query->where('user_id', $user->getKey());
            } elseif ($user->hasPermissionTo(PermissionEnum::ReadEnrollment) || $user->hasPermissionTo(PermissionEnum::CreateEnrollment)) {
                $query->whereHas('course.course_instructors', static function ($relation) use ($user): void {
                    $relation->where('users.id', $user->getKey());
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $items = $query
            ->paginate($request->input('per_page'))
            ->appends($request->query());

        $enrollmentRequests = EnrollmentRequestData::collect($items);

        $abilities = [
            'can_manage' => $user ? ($user->hasRole(RoleEnum::SuperAdmin->value) || $user->hasPermissionTo(PermissionEnum::CreateEnrollment)) : false,
            'can_create' => $user ? $user->can('create', EnrollmentRequest::class) : false,
            'is_student' => $user ? $user->hasRole(RoleEnum::Student->value) : false,
        ];

        return $this->respond($request, 'enrollment-request/index', [
            'enrollmentRequests' => $enrollmentRequests,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
            'abilities' => $abilities,
        ]);
    }

    public function create(): Response {
        return Inertia::render('enrollment-request/create');
    }

    public function show(EnrollmentRequest $enrollmentRequest): Response {
        return Inertia::render('enrollment-request/show', [
            'record' => EnrollmentRequestData::fromModel($enrollmentRequest)->toArray(),
        ]);
    }

    public function edit(EnrollmentRequest $enrollmentRequest): Response {
        return Inertia::render('enrollment-request/edit', [
            'record' => EnrollmentRequestData::fromModel($enrollmentRequest)->toArray(),
        ]);
    }

    public function store(EnrollmentRequestData $enrollmentRequestData): RedirectResponse {
        $this->authorize('create', EnrollmentRequest::class);

        $enrollmentRequest = EnrollmentRequest::create($enrollmentRequestData->toArray());

        return redirect()
            ->route('enrollment-requests.index', $enrollmentRequest)
            ->with('flash.success', 'Enrollment request created.');
    }

    public function update(EnrollmentRequestData $enrollmentRequestData, EnrollmentRequest $enrollmentRequest): RedirectResponse {
        $this->authorize('update', $enrollmentRequest);

        $enrollmentRequest->update($enrollmentRequestData->toArray());

        return redirect()
            ->route('enrollment-requests.index', $enrollmentRequest)
            ->with('flash.success', 'Enrollment request updated.');
    }

    public function destroy(EnrollmentRequest $enrollmentRequest): RedirectResponse {
        $this->authorize('delete', $enrollmentRequest);

        $enrollmentRequest->delete();

        return redirect()
            ->route('enrollment-requests.index')
            ->with('flash.success', 'Enrollment request deleted.');
    }

    public function bulkDelete(Request $request): JsonResponse {
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

    public function approve(Request $request, EnrollmentRequest $enrollmentRequest): RedirectResponse|JsonResponse {
        $enrollmentRequest->loadMissing(['course', 'user']);

        $this->authorize('respond', $enrollmentRequest);

        if ($enrollmentRequest->status === EnrollmentRequestEnum::Approved) {
            return $this->statusResponse($request, 'Permintaan pendaftaran sudah disetujui sebelumnya.', 'flash.info');
        }

        DB::transaction(function () use ($enrollmentRequest): void {
            $enrollmentRequest->update([
                'status' => EnrollmentRequestEnum::Approved,
            ]);

            if ($enrollmentRequest->course_id && $enrollmentRequest->user_id) {
                Enrollment::query()->firstOrCreate(
                    [
                        'course_id' => $enrollmentRequest->course_id,
                        'user_id' => $enrollmentRequest->user_id,
                    ],
                    [
                        'progress' => 0,
                        'completed_at' => null,
                    ],
                );
            }
        });

        return $this->statusResponse($request, 'Permintaan pendaftaran disetujui.', 'flash.success');
    }

    public function reject(Request $request, EnrollmentRequest $enrollmentRequest): RedirectResponse|JsonResponse {
        $enrollmentRequest->loadMissing(['course', 'user']);

        $this->authorize('respond', $enrollmentRequest);

        if ($enrollmentRequest->status === EnrollmentRequestEnum::Rejected) {
            return $this->statusResponse($request, 'Permintaan pendaftaran sudah ditolak sebelumnya.', 'flash.info');
        }

        $enrollmentRequest->update([
            'status' => EnrollmentRequestEnum::Rejected,
        ]);

        return $this->statusResponse($request, 'Permintaan pendaftaran ditolak.', 'flash.success');
    }

    private function statusResponse(Request $request, string $message, string $flashKey): RedirectResponse|JsonResponse {
        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message,
            ]);
        }

        return redirect()
            ->route('enrollment-requests.index')
            ->with($flashKey, $message);
    }
}
