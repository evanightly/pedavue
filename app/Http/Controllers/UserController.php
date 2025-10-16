<?php

namespace App\Http\Controllers;

use App\Data\User\UserData;
use App\Models\Role;
use App\Models\User;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = User::class;
    protected array $allowedFilters = ['created_at', 'email', 'name', 'password', 'search', 'updated_at'];
    protected array $allowedSorts = ['created_at', 'email', 'id', 'name', 'password', 'updated_at'];
    protected array $allowedIncludes = [];
    protected array $defaultIncludes = ['roles'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(User::class, 'user');
    }

    protected function filters(): array {
        return [
            'email',
            'name',
            'password',
            MultiColumnSearchFilter::make(['email', 'name', 'password']),
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

        $users = UserData::collect($items);

        return $this->respond($request, 'user/index', [
            'users' => $users,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }

    public function create(): Response {
        return Inertia::render('user/create', [
            'allRoles' => Role::all()->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
            ]),
        ]);
    }

    public function show(User $user): Response {
        return Inertia::render('user/show', [
            'record' => UserData::fromModel($user)->toArray(),
        ]);
    }

    public function edit(User $user): Response {
        return Inertia::render('user/edit', [
            'record' => UserData::fromModel($user)->toArray(),
            'allRoles' => Role::all()->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
            ]),
        ]);
    }

    public function store(UserData $userData): RedirectResponse {
        $data = $userData->toArray();
        $roleIds = array_map('intval', is_array($data['roleIds'] ?? null) ? $data['roleIds'] : []);
        unset($data['roleIds'], $data['roles'], $data['permissions'], $data['role']);

        $user = User::create($data);

        $user->syncRoles($roleIds);

        return redirect()
            ->route('users.index', $user)
            ->with('flash.success', 'User created.');
    }

    public function update(UserData $userData, User $user): RedirectResponse {
        $data = $userData->toArray();
        $roleIds = array_map('intval', is_array($data['roleIds'] ?? null) ? $data['roleIds'] : []);
        unset($data['roleIds'], $data['roles'], $data['permissions'], $data['role']);

        if (!filled($data['password'] ?? null)) {
            unset($data['password']);
        }

        $user->update($data);

        $user->syncRoles($roleIds);

        return redirect()
            ->route('users.index', $user)
            ->with('flash.success', 'User updated.');
    }

    public function destroy(User $user): RedirectResponse {
        $user->delete();

        return redirect()
            ->route('users.index')
            ->with('flash.success', 'User deleted.');
    }

    public function bulkDelete(Request $request): JsonResponse {
        $this->authorize('deleteAny', User::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = User::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }
}
