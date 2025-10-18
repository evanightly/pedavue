<?php

namespace App\Http\Controllers;

use App\Data\QuizQuestion\QuizQuestionData;
use App\Models\QuizQuestion;
use Illuminate\Http\Request;

class QuizQuestionController extends BaseResourceController
{

    protected string $modelClass = QuizQuestion::class;
    protected array $allowedFilters = ['question', 'created_at', 'updated_at'];
    protected array $allowedSorts = ['created_at', 'updated_at'];
    protected array $allowedIncludes = [];
    protected array $defaultIncludes = [];
    protected array $defaultSorts = ['-created_at'];
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

        $quizzes = QuizQuestionData::collect($items);

        // return $this->respond($request, 'user/index', [
        //     'quizzes' => $quizzes,
        //     'filters' => $request->only($this->allowedFilters),
        //     'filteredData' => $filteredData,
        //     'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        // ]);
        return $quizzes;
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
    public function store(QuizQuestionData $quizQuestionData)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(QuizQuestion $quizQuestion)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(QuizQuestion $quizQuestion)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(QuizQuestionData $quizQuestionData, QuizQuestion $quizQuestion)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(QuizQuestion $quizQuestion)
    {
        //
    }
}
