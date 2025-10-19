<?php

namespace App\Http\Controllers;

use App\Data\Module\ModuleData;
use App\Models\Module;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class ModuleController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = Module::class;
    protected array $allowedFilters = ['course_id', 'created_at', 'description', 'duration', 'order', 'search', 'thumbnail', 'title', 'updated_at'];
    protected array $allowedSorts = ['course_id', 'created_at', 'description', 'duration', 'id', 'order', 'thumbnail', 'title', 'updated_at'];
    protected array $allowedIncludes = ['course'];
    protected array $defaultIncludes = ['course'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(Module::class, 'module');
    }

    protected function filters(): array
    {
        return [
            'course_id',
            'description',
            'duration',
            'order',
            'thumbnail',
            'title',
            MultiColumnSearchFilter::make(['description', 'thumbnail', 'title']),
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

        $modules = ModuleData::collect($items);

        return $this->respond($request, 'module/index', [
            'modules' => $modules,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('module/create');
    }
    public function show(Module $module): Response
    {
        return Inertia::render('module/show', [
            'record' => ModuleData::fromModel($module)->toArray(),
        ]);
    }
    public function edit(Module $module): Response
    {
        return Inertia::render('module/edit', [
            'record' => ModuleData::fromModel($module)->toArray(),
        ]);
    }
    public function store(ModuleData $moduleData): RedirectResponse
    {
        $module = Module::create($moduleData->toArray());
        return redirect()
            ->route('modules.index', $module)
            ->with('flash.success', 'Module created.');
    }
    public function update(ModuleData $moduleData, Module $module): RedirectResponse
    {
        $module->update($moduleData->toArray());
        return redirect()
            ->route('modules.index', $module)
            ->with('flash.success', 'Module updated.');
    }
    public function destroy(Module $module): RedirectResponse
    {
        $module->delete();
        return redirect()
            ->route('modules.index')
            ->with('flash.success', 'Module deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', Module::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = Module::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
