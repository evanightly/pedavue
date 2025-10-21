<?php

namespace App\Http\Controllers;

use App\Data\QuizResult\QuizResultData;
use App\Models\QuizResult;
use App\QueryFilters\DateRangeFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class QuizResultController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = QuizResult::class;
    protected array $allowedFilters = ['attempt', 'created_at', 'finished_at', 'quiz_id', 'score', 'started_at', 'updated_at', 'user_id'];
    protected array $allowedSorts = ['attempt', 'created_at', 'finished_at', 'id', 'quiz_id', 'score', 'started_at', 'updated_at', 'user_id'];
    protected array $allowedIncludes = ['quiz', 'user'];
    protected array $defaultIncludes = ['quiz', 'user'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(QuizResult::class, 'quiz_result');
    }

    protected function filters(): array
    {
        return [
            'attempt',
            'quiz_id',
            'score',
            'user_id',
            DateRangeFilter::make('created_at'),
            DateRangeFilter::make('finished_at'),
            DateRangeFilter::make('started_at'),
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

        $quizResults = QuizResultData::collect($items);

        return $this->respond($request, 'quiz-result/index', [
            'quizResults' => $quizResults,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('quiz-result/create');
    }
    public function show(QuizResult $quizResult): Response
    {
        return Inertia::render('quiz-result/show', [
            'record' => QuizResultData::fromModel($quizResult)->toArray(),
        ]);
    }
    public function edit(QuizResult $quizResult): Response
    {
        return Inertia::render('quiz-result/edit', [
            'record' => QuizResultData::fromModel($quizResult)->toArray(),
        ]);
    }
    public function store(QuizResultData $quizResultData): RedirectResponse
    {
        $quizResult = QuizResult::create($quizResultData->toArray());
        return redirect()
            ->route('quiz-results.index', $quizResult)
            ->with('flash.success', 'QuizResult created.');
    }
    public function update(QuizResultData $quizResultData, QuizResult $quizResult): RedirectResponse
    {
        $quizResult->update($quizResultData->toArray());
        return redirect()
            ->route('quiz-results.index', $quizResult)
            ->with('flash.success', 'QuizResult updated.');
    }
    public function destroy(QuizResult $quizResult): RedirectResponse
    {
        $quizResult->delete();
        return redirect()
            ->route('quiz-results.index')
            ->with('flash.success', 'QuizResult deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', QuizResult::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = QuizResult::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
