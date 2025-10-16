<?php

namespace App\Http\Controllers;

use App\Data\Role\RoleData;
use App\Models\Permission;
use App\Models\Role;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = Role::class;
    protected array $allowedFilters = ['created_at', 'guard_name', 'name', 'search', 'updated_at'];
    protected array $allowedSorts = ['created_at', 'guard_name', 'id', 'name', 'updated_at'];
    protected array $allowedIncludes = [];
    protected array $defaultIncludes = ['permissions'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(Role::class, 'role');
    }

    protected function filters(): array {
        return [
            'guard_name',
            'name',
            MultiColumnSearchFilter::make(['guard_name', 'name']),
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

        $roles = RoleData::collect($items);

        return $this->respond($request, 'role/index', [
            'roles' => $roles,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }

    public function create(): Response {
        return Inertia::render('role/create', [
            'allPermissions' => Permission::all()->map(fn ($permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'group' => $permission->group,
            ]),
        ]);
    }

    public function show(Role $role): Response {
        return Inertia::render('role/show', [
            'record' => RoleData::fromModel($role)->toArray(),
        ]);
    }

    public function edit(Role $role): Response {
        return Inertia::render('role/edit', [
            'record' => RoleData::fromModel($role)->toArray(),
            'allPermissions' => Permission::all()->map(fn ($permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'group' => $permission->group,
            ]),
        ]);
    }

    public function store(RoleData $roleData): RedirectResponse {
        $data = $roleData->toArray();
        $permissionIds = $data['permissionIds'];
        unset($data['permissionIds'], $data['permissions']);

        $role = Role::create($data);

        $permissionIds = Permission::whereIn('id', $permissionIds ?? [])->get();
        $role->syncPermissions($permissionIds);

        return redirect()
            ->route('roles.index', $role)
            ->with('flash.success', 'Role created.');
    }

    public function update(RoleData $roleData, Role $role): RedirectResponse {
        $data = $roleData->toArray();
        $permissionIds = array_map('intval', is_array($data['permissionIds'] ?? null) ? $data['permissionIds'] : []);
        unset($data['permissionIds'], $data['permissions']);

        $role->update($data);

        $role->syncPermissions($permissionIds);

        return redirect()
            ->route('roles.index', $role)
            ->with('flash.success', 'Role updated.');
    }

    public function destroy(Role $role): RedirectResponse {
        $role->delete();

        return redirect()
            ->route('roles.index')
            ->with('flash.success', 'Role deleted.');
    }

    public function bulkDelete(Request $request): JsonResponse {
        $this->authorize('deleteAny', Role::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = Role::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }
}
