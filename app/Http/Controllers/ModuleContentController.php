<?php

namespace App\Http\Controllers;

use App\Data\ModuleContent\ModuleContentData;
use App\Models\ModuleContent;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class ModuleContentController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = ModuleContent::class;
    protected array $allowedFilters = ['content_type', 'content_url', 'created_at', 'description', 'duration', 'file_path', 'module_stage_id', 'search', 'title', 'updated_at'];
    protected array $allowedSorts = ['content_type', 'content_url', 'created_at', 'description', 'duration', 'file_path', 'id', 'module_stage_id', 'title', 'updated_at'];
    protected array $allowedIncludes = ['module_stage'];
    protected array $defaultIncludes = ['module_stage'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(ModuleContent::class, 'module_content');
    }

    protected function filters(): array
    {
        return [
            'content_type',
            'content_url',
            'description',
            'duration',
            'file_path',
            'module_stage_id',
            'title',
            MultiColumnSearchFilter::make(['content_type', 'content_url', 'description', 'file_path', 'title']),
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

        $moduleContents = ModuleContentData::collect($items);

        return $this->respond($request, 'module-content/index', [
            'moduleContents' => $moduleContents,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('module-content/create');
    }
    public function show(ModuleContent $moduleContent): Response
    {
        return Inertia::render('module-content/show', [
            'record' => ModuleContentData::fromModel($moduleContent)->toArray(),
        ]);
    }
    public function edit(ModuleContent $moduleContent): Response
    {
        return Inertia::render('module-content/edit', [
            'record' => ModuleContentData::fromModel($moduleContent)->toArray(),
        ]);
    }
    public function store(ModuleContentData $moduleContentData): RedirectResponse
    {
        $moduleContent = ModuleContent::create($moduleContentData->toArray());
        return redirect()
            ->route('module-contents.index', $moduleContent)
            ->with('flash.success', 'ModuleContent created.');
    }
    public function update(ModuleContentData $moduleContentData, ModuleContent $moduleContent): RedirectResponse
    {
        $moduleContent->update($moduleContentData->toArray());
        return redirect()
            ->route('module-contents.index', $moduleContent)
            ->with('flash.success', 'ModuleContent updated.');
    }
    public function destroy(ModuleContent $moduleContent): RedirectResponse
    {
        $moduleContent->delete();
        return redirect()
            ->route('module-contents.index')
            ->with('flash.success', 'ModuleContent deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', ModuleContent::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = ModuleContent::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
