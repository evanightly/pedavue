<?php

namespace App\Http\Controllers;

use App\Data\QuizResultAnswer\QuizResultAnswerData;
use App\Models\QuizResultAnswer;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class QuizResultAnswerController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = QuizResultAnswer::class;
    protected array $allowedFilters = ['answer_id', 'created_at', 'finished_at', 'question_id', 'quiz_result_id', 'search', 'started_at', 'updated_at', 'user_answer_text'];
    protected array $allowedSorts = ['answer_id', 'created_at', 'finished_at', 'id', 'question_id', 'quiz_result_id', 'started_at', 'updated_at', 'user_answer_text'];
    protected array $allowedIncludes = ['answer', 'question', 'quiz_result'];
    protected array $defaultIncludes = ['answer', 'question', 'quiz_result'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(QuizResultAnswer::class, 'quiz_result_answer');
    }

    protected function filters(): array
    {
        return [
            'answer_id',
            'question_id',
            'quiz_result_id',
            'user_answer_text',
            MultiColumnSearchFilter::make(['user_answer_text']),
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

        $quizResultAnswers = QuizResultAnswerData::collect($items);

        return $this->respond($request, 'quiz-result-answer/index', [
            'quizResultAnswers' => $quizResultAnswers,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('quiz-result-answer/create');
    }
    public function show(QuizResultAnswer $quizResultAnswer): Response
    {
        return Inertia::render('quiz-result-answer/show', [
            'record' => QuizResultAnswerData::fromModel($quizResultAnswer)->toArray(),
        ]);
    }
    public function edit(QuizResultAnswer $quizResultAnswer): Response
    {
        return Inertia::render('quiz-result-answer/edit', [
            'record' => QuizResultAnswerData::fromModel($quizResultAnswer)->toArray(),
        ]);
    }
    public function store(QuizResultAnswerData $quizResultAnswerData): RedirectResponse
    {
        $quizResultAnswer = QuizResultAnswer::create($quizResultAnswerData->toArray());
        return redirect()
            ->route('quiz-result-answers.index', $quizResultAnswer)
            ->with('flash.success', 'QuizResultAnswer created.');
    }
    public function update(QuizResultAnswerData $quizResultAnswerData, QuizResultAnswer $quizResultAnswer): RedirectResponse
    {
        $quizResultAnswer->update($quizResultAnswerData->toArray());
        return redirect()
            ->route('quiz-result-answers.index', $quizResultAnswer)
            ->with('flash.success', 'QuizResultAnswer updated.');
    }
    public function destroy(QuizResultAnswer $quizResultAnswer): RedirectResponse
    {
        $quizResultAnswer->delete();
        return redirect()
            ->route('quiz-result-answers.index')
            ->with('flash.success', 'QuizResultAnswer deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', QuizResultAnswer::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = QuizResultAnswer::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
