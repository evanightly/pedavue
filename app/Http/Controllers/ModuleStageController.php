<?php

namespace App\Http\Controllers;

use App\Data\ModuleStage\ModuleStageData;
use App\Models\ModuleStage;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class ModuleStageController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = ModuleStage::class;
    protected array $allowedFilters = ['created_at', 'module_able', 'module_content_id', 'module_id', 'module_quiz_id', 'order', 'search', 'updated_at'];
    protected array $allowedSorts = ['created_at', 'id', 'module_able', 'module_content_id', 'module_id', 'module_quiz_id', 'order', 'updated_at'];
    protected array $allowedIncludes = ['module', 'module_content', 'module_quiz'];
    protected array $defaultIncludes = ['module', 'module_content', 'module_quiz'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(ModuleStage::class, 'module_stage');
    }

    protected function filters(): array
    {
        return [
            'module_able',
            'module_content_id',
            'module_id',
            'module_quiz_id',
            'order',
            MultiColumnSearchFilter::make(['module_able']),
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

        $moduleStages = ModuleStageData::collect($items);

        return $this->respond($request, 'module-stage/index', [
            'moduleStages' => $moduleStages,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('module-stage/create');
    }
    public function show(ModuleStage $moduleStage): Response
    {
        return Inertia::render('module-stage/show', [
            'record' => ModuleStageData::fromModel($moduleStage)->toArray(),
        ]);
    }
    public function edit(ModuleStage $moduleStage): Response
    {
        return Inertia::render('module-stage/edit', [
            'record' => ModuleStageData::fromModel($moduleStage)->toArray(),
        ]);
    }
    public function store(ModuleStageData $moduleStageData): RedirectResponse
    {
        $moduleStage = ModuleStage::create($moduleStageData->toArray());
        return redirect()
            ->route('module-stages.index', $moduleStage)
            ->with('flash.success', 'ModuleStage created.');
    }
    public function update(ModuleStageData $moduleStageData, ModuleStage $moduleStage): RedirectResponse
    {
        $moduleStage->update($moduleStageData->toArray());
        return redirect()
            ->route('module-stages.index', $moduleStage)
            ->with('flash.success', 'ModuleStage updated.');
    }
    public function destroy(ModuleStage $moduleStage): RedirectResponse
    {
        $moduleStage->delete();
        return redirect()
            ->route('module-stages.index')
            ->with('flash.success', 'ModuleStage deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', ModuleStage::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = ModuleStage::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
