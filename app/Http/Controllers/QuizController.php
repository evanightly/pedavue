<?php

namespace App\Http\Controllers;

use App\Data\Quiz\QuizData;
use App\Exports\Quiz\QuizzesTemplateExport;
use App\Imports\Quiz\QuizzesImport;
use App\Models\Quiz;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class QuizController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = Quiz::class;
    protected array $allowedFilters = ['name', 'description', 'duration', 'is_question_shuffled', 'type', 'created_at', 'updated_at'];
    protected array $allowedSorts = ['duration', 'created_at', 'updated_at'];
    protected array $allowedIncludes = ['quiz_questions'];
    protected array $defaultIncludes = [];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(Quiz::class, 'quiz');
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

        $quizzes = QuizData::collect($items);

        return $this->respond($request, 'quiz/index', [
            'quizzes' => $quizzes,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
        // return $quizzes;
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        if (request()->has('download')) {
            return (new QuizzesTemplateExport())->download('quiz_template.xlsx');
        }
        return Inertia::render('quiz/create');
        
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(QuizData $quizData)
    {
        $data = $quizData->toArray();
        if (!filled($data['type'] ?? null)) {
            unset($data['type']);
        }
        $quiz = Quiz::create($data);
        if (request()->hasFile('import')) {
            $file = request()->file('import');
            Excel::import(new QuizzesImport($quiz), $file);
        }
        return $quiz;
    }
    public function importQuestions(QuizData $quizData, Quiz $quiz)
    {
        $data = $quizData->toArray();
        Excel::import(new QuizzesImport($quiz), $data['file']);
    }

    /**
     * Display the specified resource.
     */
    public function show(Quiz $quiz)
    {
        return QuizData::fromModel($quiz->load('quiz_questions.quiz_question_options'))->toArray();
        // return Inertia::render('quiz/show', [
        //     'record' => QuizData::fromModel($quiz)->toArray(),
        // ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Quiz $quiz)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(QuizData $quizData, Quiz $quiz)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Quiz $quiz)
    {
        //
    }
}
