<?php

namespace App\Http\Controllers;

use App\Data\QuizResponseAnswer\QuizResponseAnswerData;
use App\Models\QuizResponseAnswer;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class QuizResponseAnswerController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = QuizResponseAnswer::class;
    protected array $allowedFilters = ['quiz_response_id', 'quiz_question_id', 'quiz_question_option_id', 'started_at', 'finished_at', 'created_at', 'updated_at'];
    protected array $allowedSorts = ['started_at', 'finished_at', 'created_at', 'updated_at'];
    protected array $allowedIncludes = ['quiz_response', 'quiz_question', 'quiz_question_option'];
    protected array $defaultIncludes = [];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(QuizResponseAnswer::class, 'quiz');
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

        $quiz_response_answers = QuizResponseAnswerData::collect($items);

        // return $this->respond($request, 'user/index', [
        //     'quiz_response_answers' => $quiz_response_answers,
        //     'filters' => $request->only($this->allowedFilters),
        //     'filteredData' => $filteredData,
        //     'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        // ]);
        return $quiz_response_answers;
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
    public function store(QuizResponseAnswerData $quizResponseAnswerData)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(QuizResponseAnswer $quizResponseAnswer)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(QuizResponseAnswer $quizResponseAnswer)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(QuizResponseAnswerData $quizResponseAnswerData, QuizResponseAnswer $quizResponseAnswer)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(QuizResponseAnswer $quizResponseAnswer)
    {
        //
    }
}
