<?php

namespace App\Http\Controllers;

use App\Data\QuizResponse\QuizResponseData;
use App\Models\QuizResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class QuizResponseController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = QuizResponse::class;
    protected array $allowedFilters = ['quiz_id', 'user_id', 'attempt', 'score', 'started_at', 'finished_at', 'created_at', 'updated_at'];
    protected array $allowedSorts = ['score', 'started_at', 'finished_at', 'created_at', 'updated_at'];
    protected array $allowedIncludes = ['quiz', 'quiz_response_answers'];
    protected array $defaultIncludes = [];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(QuizResponse::class, 'quiz_response');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filteredData = [];

        $query = $this->buildIndexQuery($request);

        $items = $query
            ->paginate($request->input('per_page'))
            ->appends($request->query());

        $quiz_responses = QuizResponseData::collect($items);

        // return $this->respond($request, 'user/index', [
        //     'quiz_responses' => $quiz_responses,
        //     'filters' => $request->only($this->allowedFilters),
        //     'filteredData' => $filteredData,
        //     'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        // ]);
        return $quiz_responses;
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(QuizResponseData $quizResponseData)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(QuizResponse $quizResponse)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(QuizResponse $quizResponse)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(QuizResponseData $quizResponseData, QuizResponse $quizResponse)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(QuizResponse $quizResponse)
    {
        //
    }
}
