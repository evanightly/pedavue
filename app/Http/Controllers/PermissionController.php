<?php

namespace App\Http\Controllers;

use App\Data\Permission\PermissionData;
use App\Models\Permission;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermissionController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = Permission::class;
    protected array $allowedFilters = ['created_at', 'group', 'guard_name', 'name', 'search', 'updated_at'];
    protected array $allowedSorts = ['created_at', 'group', 'guard_name', 'id', 'name', 'updated_at'];
    protected array $allowedIncludes = [];
    protected array $defaultIncludes = [];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(Permission::class);
    }

    protected function filters(): array {
        return [
            'group',
            'guard_name',
            'name',
            MultiColumnSearchFilter::make(['group', 'guard_name', 'name']),
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

        $permissions = PermissionData::collect($items);

        return $this->respond($request, 'permission/index', [
            'permissions' => $permissions,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }

    public function create(): Response {
        return Inertia::render('permission/create');
    }

    public function show(Permission $permission): Response {
        return Inertia::render('permission/show', [
            'record' => PermissionData::fromModel($permission)->toArray(),
        ]);
    }

    public function edit(Permission $permission): Response {
        return Inertia::render('permission/edit', [
            'record' => PermissionData::fromModel($permission)->toArray(),
        ]);
    }

    public function store(PermissionData $permissionData): RedirectResponse {
        $permission = Permission::create($permissionData->toArray());

        return redirect()
            ->route('permissions.index', $permission)
            ->with('flash.success', 'Permission created.');
    }

    public function update(PermissionData $permissionData, Permission $permission): RedirectResponse {
        $permission->update($permissionData->toArray());

        return redirect()
            ->route('permissions.index', $permission)
            ->with('flash.success', 'Permission updated.');
    }

    public function destroy(Permission $permission): RedirectResponse {
        $permission->delete();

        return redirect()
            ->route('permissions.index')
            ->with('flash.success', 'Permission deleted.');
    }

    public function bulkDelete(Request $request): JsonResponse {
        $this->authorize('deleteAny', Permission::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = Permission::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }
}
