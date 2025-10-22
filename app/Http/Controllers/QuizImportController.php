<?php

namespace App\Http\Controllers;

use App\Data\Quiz\QuizData;
use App\Data\QuizImport\QuizImportPreviewData;
use App\Exports\QuizQuestion\QuizQuestionTemplateExport;
use App\Http\Requests\Quiz\QuizImportConfirmRequest;
use App\Http\Requests\Quiz\QuizImportPreviewRequest;
use App\Models\Quiz;
use App\Support\QuizImport\QuizImportPreviewStore;
use App\Support\QuizImport\QuizImportService;
use App\Support\QuizPayloadManager;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class QuizImportController extends Controller {
    use AuthorizesRequests;

    public function __construct(
        private readonly QuizImportService $importService,
        private readonly QuizImportPreviewStore $previewStore,
        private readonly QuizPayloadManager $payloadManager,
    ) {}

    public function show(Request $request, Quiz $quiz): Response {
        $quizData = QuizData::fromModel($quiz->load('quiz_questions.quiz_question_options'));
        $returnUrl = $this->resolveReturnUrl($request);

        return Inertia::render('quizzes/import', [
            'quiz' => $quizData,
            'step' => 'form',
            'templateUrl' => route('quizzes.import.template', ['quiz' => $quiz->getKey()]),
            'existingQuestionCount' => $quizData->quiz_questions?->count() ?? 0,
            'returnUrl' => $returnUrl,
        ]);
    }

    public function template(Request $request): BinaryFileResponse {
        $quizId = $request->integer('quiz');
        $dataset = [];
        $fileName = 'template-import-kuis.xlsx';

        if ($quizId) {
            $quiz = Quiz::query()
                ->with(['quiz_questions.quiz_question_options'])
                ->find($quizId);

            if ($quiz && $request->user()->can('view', $quiz)) {
                $fileName = 'template-kuis-' . Str::slug($quiz->name ?? 'kuis') . '.xlsx';

                $dataset = $quiz->quiz_questions
                    ->sortBy('order')
                    ->values()
                    ->map(function ($question) {
                        $options = $question->quiz_question_options
                            ->sortBy('order')
                            ->values();

                        [$correct, $incorrect] = $options->partition(fn ($option) => (bool) $option->is_correct);
                        $ordered = $correct->concat($incorrect)->values();

                        return [
                            'question' => $question->question,
                            'options' => $ordered
                                ->map(fn ($option) => [
                                    'option_text' => $option->option_text,
                                    'is_correct' => (bool) $option->is_correct,
                                ])
                                ->all(),
                        ];
                    })
                    ->all();
            }
        }

        return (new QuizQuestionTemplateExport($dataset))->download($fileName);
    }

    public function parse(Request $request): JsonResponse {
        $this->authorize('create', Quiz::class);

        $validated = $request->validate(
            [
                'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240'],
            ],
            [
                'file.required' => 'Pilih berkas Excel sebelum melanjutkan.',
                'file.file' => 'Berkas Excel tidak valid. Coba pilih ulang berkas Anda.',
                'file.mimes' => 'Format berkas harus .xlsx atau .xls.',
                'file.max' => 'Berkas Excel melebihi batas 10 MB. Kurangi ukuran gambar di dalam file lalu coba lagi.',
                'file.uploaded' => 'Berkas Excel gagal diunggah. Pastikan ukurannya tidak melebihi 10 MB dan file tidak sedang dibuka aplikasi lain.',
            ],
        );

        /** @var \Illuminate\Http\UploadedFile $file */
        $file = $validated['file'];
        $parseResult = $this->importService->parse($file);

        if ($parseResult->hasErrors()) {
            return response()->json(['errors' => $parseResult->errors()], 422);
        }

        return response()->json([
            'questions' => $parseResult->questions(),
            'warnings' => $parseResult->warnings(),
        ]);
    }

    public function preview(QuizImportPreviewRequest $request, Quiz $quiz): Response|RedirectResponse {
        $quiz->load('quiz_questions.quiz_question_options');
        $quizData = QuizData::fromModel($quiz);
        $returnUrl = $this->resolveReturnUrl($request);

        if ($request->isMethod('get')) {
            $token = $request->string('token')->toString();
            $payload = $this->previewStore->retrieve($token);

            if (!$payload || (int) ($payload['quiz_id'] ?? 0) !== $quiz->getKey() || (int) ($payload['user_id'] ?? 0) !== $request->user()->getKey()) {
                if ($token !== '') {
                    $this->previewStore->forget($token);
                }

                return Redirect::route('quizzes.import.show', $this->appendReturnParam($quiz, $returnUrl))
                    ->with('error', 'Pratinjau impor tidak ditemukan atau sudah kedaluwarsa. Unggah ulang berkas Anda.');
            }

            $preview = QuizImportPreviewData::fromPayload(
                $token,
                $quizData,
                $payload['questions'] ?? [],
                $quizData->quiz_questions,
                $payload['warnings'] ?? [],
            );

            return Inertia::render('quizzes/import', [
                'quiz' => $quizData,
                'step' => 'preview',
                'templateUrl' => route('quizzes.import.template', ['quiz' => $quiz->getKey()]),
                'preview' => $preview,
                'existingQuestionCount' => $quizData->quiz_questions?->count() ?? 0,
                'returnUrl' => $returnUrl,
            ]);
        }

        $file = $request->file('file');
        $parseResult = $this->importService->parse($file);

        if ($parseResult->hasErrors()) {
            throw ValidationException::withMessages($parseResult->errors());
        }

        $token = $this->previewStore->store(
            quizId: $quiz->getKey(),
            userId: $request->user()->getKey(),
            questions: $parseResult->questions(),
            warnings: $parseResult->warnings(),
        );

        $redirectParameters = [
            'quiz' => $quiz->getKey(),
            'token' => $token,
        ];

        if ($returnUrl !== null) {
            $redirectParameters['return'] = $returnUrl;
        }

        return Redirect::route('quizzes.import.preview', $redirectParameters);
    }

    public function confirm(QuizImportConfirmRequest $request, Quiz $quiz): RedirectResponse {
        $returnUrl = $this->resolveReturnUrl($request);
        $payload = $this->previewStore->retrieve($request->input('token'));
        if (!$payload) {
            throw ValidationException::withMessages([
                'token' => 'Pratinjau impor tidak ditemukan atau sudah kedaluwarsa. Unggah ulang berkas Anda.',
            ]);
        }

        if ((int) ($payload['quiz_id'] ?? 0) !== $quiz->getKey() || (int) ($payload['user_id'] ?? 0) !== $request->user()->getKey()) {
            $this->previewStore->forget($request->input('token'));

            throw ValidationException::withMessages([
                'token' => 'Pratinjau impor tidak valid. Silakan mulai ulang proses impor.',
            ]);
        }

        $mode = $request->string('mode')->toString();
        $questionsPayload = $this->buildPayloadFromPreview($quiz, $payload['questions'], $mode);

        $this->payloadManager->updateQuiz($quiz, [
            'name' => $quiz->name,
            'description' => $quiz->description,
            'duration' => $quiz->duration,
            'is_question_shuffled' => $quiz->is_question_shuffled,
            'type' => $quiz->type,
            'questions' => $questionsPayload,
        ]);

        $token = $request->input('token');
        if (is_string($token)) {
            $this->previewStore->forget($token);
        }

        return Redirect::route('quizzes.import.show', $this->appendReturnParam($quiz, $returnUrl))
            ->with('success', 'Pertanyaan dari file berhasil diimpor.');
    }

    private function resolveReturnUrl(Request $request): ?string {
        $raw = $request->query('return');

        if (is_array($raw)) {
            $raw = reset($raw) ?: null;
        }

        if ($raw === null) {
            return null;
        }

        $value = trim((string) $raw);

        if ($value === '') {
            return null;
        }

        if (Str::startsWith($value, ['http://', 'https://'])) {
            $parsed = parse_url($value);
            if ($parsed === false) {
                return null;
            }

            $host = $parsed['host'] ?? null;
            if ($host !== $request->getHost()) {
                return null;
            }

            $path = $parsed['path'] ?? '/';
            $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';

            return $path . $query;
        }

        return Str::startsWith($value, '/') ? $value : '/' . ltrim($value, '/');
    }

    /**
     * @return array<string, mixed>
     */
    private function appendReturnParam(Quiz $quiz, ?string $returnUrl): array {
        $parameters = ['quiz' => $quiz->getKey()];

        if ($returnUrl !== null) {
            $parameters['return'] = $returnUrl;
        }

        return $parameters;
    }

    /**
     * @param  array<int, array{question:?string,image:?array{data:string,mime_type:string,extension:string,original_name:string},options:array<int, array{option_text:?string,is_correct:bool,image:?array{data:string,mime_type:string,extension:string,original_name:string}}>}  $questions
     * @return array<int, array<string, mixed>>
     */
    private function buildPayloadFromPreview(Quiz $quiz, array $questions, string $mode): array {
        $quiz->loadMissing('quiz_questions.quiz_question_options');

        $existingPayload = [];
        if ($mode === 'append') {
            $existingPayload = $quiz->quiz_questions
                ->sortBy('order')
                ->values()
                ->map(fn ($question) => [
                    'question' => $question->question,
                    'existing_question_image' => $question->question_image,
                    'remove_question_image' => false,
                    'is_answer_shuffled' => (bool) $question->is_answer_shuffled,
                    'order' => $question->order,
                    'options' => $question->quiz_question_options
                        ->sortBy('order')
                        ->values()
                        ->map(fn ($option) => [
                            'option_text' => $option->option_text,
                            'existing_option_image' => $option->option_image,
                            'remove_option_image' => false,
                            'is_correct' => (bool) $option->is_correct,
                            'order' => $option->order,
                        ])->all(),
                ])->all();
        }

        $importedPayload = [];
        foreach ($questions as $questionIndex => $question) {
            if (!is_array($question)) {
                continue;
            }

            $optionsPayload = [];
            foreach ($question['options'] ?? [] as $optionIndex => $option) {
                if (!is_array($option)) {
                    continue;
                }

                $optionPayload = [
                    'option_text' => $option['option_text'] ?? null,
                    'is_correct' => (bool) ($option['is_correct'] ?? false),
                    'order' => $optionIndex + 1,
                ];

                if (isset($option['image']) && is_array($option['image'])) {
                    $optionPayload['option_image'] = $this->importService->toUploadedFile(
                        $option['image'],
                        'opsi-' . ($questionIndex + 1) . '-' . ($optionIndex + 1)
                    );
                }

                $optionsPayload[] = $optionPayload;
            }

            $questionPayload = [
                'question' => $question['question'] ?? null,
                'is_answer_shuffled' => false,
                'order' => $questionIndex + 1,
                'options' => $optionsPayload,
            ];

            if (isset($question['image']) && is_array($question['image'])) {
                $questionPayload['question_image'] = $this->importService->toUploadedFile(
                    $question['image'],
                    'pertanyaan-' . ($questionIndex + 1)
                );
            }

            $importedPayload[] = $questionPayload;
        }

        $reindexedExisting = $this->reindexExisting($existingPayload);
        $combined = $mode === 'append'
            ? array_merge($reindexedExisting, $this->reindexImported($importedPayload, count($reindexedExisting)))
            : $this->reindexImported($importedPayload, 0);

        return $combined;
    }

    /**
     * @param  array<int, array<string, mixed>>  $existing
     * @return array<int, array<string, mixed>>
     */
    private function reindexExisting(array $existing): array {
        foreach ($existing as $index => &$question) {
            $question['order'] = $index + 1;

            if (isset($question['options']) && is_array($question['options'])) {
                foreach ($question['options'] as $optionIndex => &$option) {
                    $option['order'] = $optionIndex + 1;
                }
                unset($option);
            }
        }

        unset($question);

        return $existing;
    }

    /**
     * @param  array<int, array<string, mixed>>  $imported
     * @return array<int, array<string, mixed>>
     */
    private function reindexImported(array $imported, int $offset): array {
        foreach ($imported as $index => &$question) {
            $question['order'] = $offset + $index + 1;

            if (isset($question['options']) && is_array($question['options'])) {
                foreach ($question['options'] as $optionIndex => &$option) {
                    $option['order'] = $optionIndex + 1;
                }
                unset($option);
            }
        }

        unset($question);

        return $imported;
    }
}
