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
    public function videos(Request $request): Response|JsonResponse
    {
        $filteredData = [];

        $query = $this->buildIndexQuery($request);

        // Restrict to video content_type
        $query->where('content_type', 'video');

        $items = $query
            ->with(['module_stage', 'video_scenes.scene_interactions'])
            ->paginate($request->input('per_page'))
            ->appends($request->query());

        $moduleContents = ModuleContentData::collect($items);

        return $this->respond($request, 'module-content/video/index', [
            'moduleContents' => $moduleContents,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }

    /**
     * Show video details for a module content using a video-specific route.
     */
    public function videoShow(ModuleContent $moduleContent): Response
    {
        $moduleContent->load(['module_stage', 'video_scenes.scene_interactions']);

        $data = ModuleContentData::fromModel($moduleContent)->toArray();

        return Inertia::render('module-content/video/show', [
            'record' => $data,
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('module-content/create');
    }
    public function show(ModuleContent $moduleContent): Response
    {
        $moduleContent->load(['module_stage', 'video_scenes.scene_interactions']);

        $data = ModuleContentData::fromModel($moduleContent)->toArray();

        if ($moduleContent->content_type === 'video') {
            return Inertia::render('module-content/video/show', [
                'record' => $data,
            ]);
        }

        return Inertia::render('module-content/show', [
            'record' => $data,
        ]);
    }
    public function edit(ModuleContent $moduleContent): Response
    {
        $moduleContent->load(['module_stage', 'video_scenes.scene_interactions']);

        $data = ModuleContentData::fromModel($moduleContent)->toArray();

        if ($moduleContent->content_type === 'video') {
            return Inertia::render('module-content/video/show', [
                'record' => $data,
            ]);
        }

        return Inertia::render('module-content/edit', [
            'record' => $data,
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
