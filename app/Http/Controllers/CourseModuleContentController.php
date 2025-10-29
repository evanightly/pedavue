<?php

namespace App\Http\Controllers;

use App\Data\Module\ModuleData;
use App\Http\Requests\CourseModule\ReorderCourseModuleStagesRequest;
use App\Http\Requests\CourseModule\StoreCourseModuleContentRequest;
use App\Http\Requests\CourseModule\UpdateCourseModuleContentRequest;
use App\Models\Course;
use App\Models\Module;
use App\Models\ModuleContent;
use App\Models\ModuleStage;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Support\QuizPayloadManager;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CourseModuleContentController extends Controller {
    use AuthorizesRequests;

    public function __construct(private QuizPayloadManager $quizPayloadManager) {}

    public function index(Request $request, Course $course, Module $module): Response {
        $this->authorize('update', $course);

        abort_unless($module->course_id === $course->getKey(), 404);

        $module->load([
            'module_stages' => static function ($query): void {
                $query->with([
                    'moduleAble' => static function (MorphTo $morphTo): void {
                        $morphTo->morphWith([
                            ModuleContent::class => [],
                            Quiz::class => ['quiz_questions.quiz_question_options'],
                        ]);
                    },
                ]);
            },
        ]);

        return Inertia::render('course/module/contents/index', [
            'course' => [
                'id' => $course->getKey(),
                'title' => $course->title,
                'slug' => $course->slug,
            ],
            'module' => ModuleData::fromModel($module)->toArray(),
            'abilities' => [
                'manage_modules' => $request->user()?->can('update', $course) ?? false,
            ],
        ]);
    }

    public function store(StoreCourseModuleContentRequest $request, Course $course, Module $module): RedirectResponse {
        $this->authorize('update', $course);

        abort_unless($module->course_id === $course->getKey(), 404);

        $payload = $request->validated();
        $type = $payload['type'];

        if ($type === 'quiz' && isset($payload['quiz']) && is_array($payload['quiz'])) {
            $payload['quiz'] = $this->attachQuizUploads($payload['quiz'], $request, 'quiz');
        }

        $stageOrder = $payload['order'] ?? null;
        if ($stageOrder === null) {
            $maxOrder = $module->module_stages()->max('order');
            $stageOrder = $maxOrder ? $maxOrder + 1 : 1;
        }

        DB::transaction(function () use ($module, $request, $payload, $stageOrder, $type): void {
            $moduleStage = ModuleStage::query()->create([
                'module_id' => $module->getKey(),
                'module_able_type' => ModuleStage::moduleAbleTypeForKey($type),
                'module_able_id' => null,
                'order' => (int) $stageOrder,
            ]);

            if ($type === 'content') {
                $content = $payload['content'] ?? [];
                $file = $request->file('content.file');
                $storedPath = null;

                if ($file) {
                    $storedPath = $file->store('courses/modules/contents', 'public');
                } elseif (!empty($content['file_path'])) {
                    $storedPath = $content['file_path'];
                }

                $contentUrl = $content['content_url'] ?? null;
                if (is_string($contentUrl)) {
                    $contentUrl = trim($contentUrl) !== '' ? trim($contentUrl) : null;
                } else {
                    $contentUrl = null;
                }

                $contentType = $this->resolveContentType(
                    $file,
                    Arr::get($content, 'content_type'),
                    $storedPath,
                    $file ? 'Berkas' : null
                );

                $moduleContent = ModuleContent::query()->create([
                    'title' => $content['title'] ?? null,
                    'description' => $content['description'] ?? null,
                    'file_path' => $storedPath,
                    'content_url' => $contentUrl,
                    'duration' => Arr::has($content, 'duration') ? (int) $content['duration'] : null,
                    'content_type' => $contentType,
                    'module_stage_id' => $moduleStage->getKey(),
                ]);

                $moduleStage->update([
                    'module_able_type' => ModuleContent::class,
                    'module_able_id' => $moduleContent->getKey(),
                ]);

                $moduleStage->setRelation('moduleAble', $moduleContent);
            }

            if ($type === 'quiz') {
                $quiz = null;

                if (isset($payload['quiz']) && is_array($payload['quiz'])) {
                    $quiz = $this->quizPayloadManager->createQuiz($payload['quiz']);
                } elseif (isset($payload['quiz_id'])) {
                    $quiz = Quiz::query()->find((int) $payload['quiz_id']);
                }

                if (!$quiz) {
                    throw ValidationException::withMessages([
                        'quiz' => 'Detail kuis wajib diisi.',
                    ]);
                }

                $moduleStage->update([
                    'module_able_type' => Quiz::class,
                    'module_able_id' => $quiz->getKey(),
                ]);

                $moduleStage->setRelation('moduleAble', $quiz);
            }

            $this->normalizeModuleStageOrder($module);
        });

        return redirect()
            ->route('courses.modules.contents.index', [$course, $module])
            ->with('flash.success', 'Konten modul berhasil ditambahkan.');
    }

    public function update(UpdateCourseModuleContentRequest $request, Course $course, Module $module, ModuleStage $stage): RedirectResponse {
        $this->authorize('update', $course);

        abort_unless($module->course_id === $course->getKey(), 404);
        abort_unless($stage->module_id === $module->getKey(), 404);

        $payload = $request->validated();
        $type = $payload['type'];

        if ($type === 'quiz' && isset($payload['quiz']) && is_array($payload['quiz'])) {
            $payload['quiz'] = $this->attachQuizUploads($payload['quiz'], $request, 'quiz');
        }

        DB::transaction(function () use ($request, $payload, $type, $stage, $module): void {
            $moduleStage = ModuleStage::query()
                ->whereKey($stage->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $moduleStage->load([
                'moduleAble' => static function (MorphTo $morphTo): void {
                    $morphTo->morphWith([
                        ModuleContent::class => [],
                        Quiz::class => ['quiz_questions.quiz_question_options'],
                    ]);
                },
            ]);

            $existingQuiz = $moduleStage->module_quiz;

            $order = $payload['order'] ?? $moduleStage->order ?? 1;
            $order = (int) $order;
            if ($order < 1) {
                $order = 1;
            }

            if ($type === 'content') {
                $contentPayload = $payload['content'] ?? [];
                $file = $request->file('content.file');
                $removeFile = (bool) Arr::get($contentPayload, 'remove_file', false);

                $existingContent = $moduleStage->module_content;
                $storedPath = $existingContent?->file_path;

                if ($file) {
                    if ($storedPath && Storage::disk('public')->exists($storedPath)) {
                        Storage::disk('public')->delete($storedPath);
                    }

                    $storedPath = $file->store('courses/modules/contents', 'public');
                } elseif ($removeFile && $storedPath) {
                    if (Storage::disk('public')->exists($storedPath)) {
                        Storage::disk('public')->delete($storedPath);
                    }

                    $storedPath = null;
                }

                $contentUrl = Arr::get($contentPayload, 'content_url');
                if (is_string($contentUrl)) {
                    $contentUrl = trim($contentUrl) !== '' ? trim($contentUrl) : null;
                } else {
                    $contentUrl = null;
                }

                $duration = Arr::has($contentPayload, 'duration')
                    ? (int) Arr::get($contentPayload, 'duration')
                    : null;

                $fallbackType = ($existingContent && !$removeFile) ? $existingContent->content_type : null;
                $contentType = $this->resolveContentType(
                    $file,
                    Arr::get($contentPayload, 'content_type'),
                    $storedPath,
                    $file ? 'Berkas' : $fallbackType
                );

                $targetContent = $existingContent;

                if ($existingContent) {
                    $existingContent->update([
                        'title' => Arr::get($contentPayload, 'title'),
                        'description' => Arr::get($contentPayload, 'description'),
                        'file_path' => $storedPath,
                        'content_url' => $contentUrl,
                        'duration' => $duration,
                        'content_type' => $contentType,
                    ]);
                } else {
                    $newContent = ModuleContent::query()->create([
                        'title' => Arr::get($contentPayload, 'title'),
                        'description' => Arr::get($contentPayload, 'description'),
                        'file_path' => $storedPath,
                        'content_url' => $contentUrl,
                        'duration' => $duration,
                        'content_type' => $contentType,
                        'module_stage_id' => $moduleStage->getKey(),
                    ]);

                    $targetContent = $newContent;
                }

                $moduleStage->setRelation('moduleAble', $targetContent);

                $moduleStage->update([
                    'module_able_type' => ModuleContent::class,
                    'module_able_id' => $targetContent?->getKey(),
                    'order' => $order,
                ]);

                if ($existingQuiz) {
                    $this->deleteModuleQuiz($existingQuiz, $moduleStage);
                }
            } else {
                $this->deleteModuleContent($moduleStage->module_content);
                $quiz = null;

                if (isset($payload['quiz']) && is_array($payload['quiz'])) {
                    $quiz = $existingQuiz
                        ? $this->quizPayloadManager->updateQuiz($existingQuiz, $payload['quiz'])
                        : $this->quizPayloadManager->createQuiz($payload['quiz']);
                } elseif (isset($payload['quiz_id'])) {
                    $quiz = Quiz::query()->find((int) $payload['quiz_id']);
                }

                if (!$quiz) {
                    throw ValidationException::withMessages([
                        'quiz' => 'Detail kuis wajib diisi.',
                    ]);
                }

                if ($existingQuiz && $quiz->getKey() !== $existingQuiz->getKey()) {
                    $this->deleteModuleQuiz($existingQuiz, $moduleStage);
                }

                $moduleStage->update([
                    'module_able_type' => Quiz::class,
                    'module_able_id' => $quiz->getKey(),
                    'order' => $order,
                ]);

                $moduleStage->unsetRelation('moduleAble');
                $moduleStage->setRelation('moduleAble', $quiz);
            }

            $this->normalizeModuleStageOrder($module);
        });

        return redirect()
            ->route('courses.modules.contents.index', [$course, $module])
            ->with('flash.success', 'Konten modul berhasil diperbarui.');
    }

    public function destroy(Request $request, Course $course, Module $module, ModuleStage $stage): RedirectResponse {
        $this->authorize('update', $course);
        abort_unless($module->course_id === $course->getKey(), 404);
        abort_unless($stage->module_id === $module->getKey(), 404);

        DB::transaction(function () use ($stage, $module): void {
            $moduleStage = ModuleStage::query()
                ->whereKey($stage->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $moduleStage->load(['module_content', 'module_quiz']);

            $this->deleteModuleContent($moduleStage->module_content);
            $this->deleteModuleQuiz($moduleStage->module_quiz, $moduleStage);

            $moduleStage->delete();

            $this->normalizeModuleStageOrder($module);
        });

        return redirect()
            ->route('courses.modules.contents.index', [$course, $module])
            ->with('flash.success', 'Konten modul berhasil dihapus.');
    }

    public function reorder(ReorderCourseModuleStagesRequest $request, Course $course, Module $module): RedirectResponse {
        $this->authorize('update', $course);

        abort_unless($module->course_id === $course->getKey(), 404);

        $stageIds = $request->validated('stage_ids');

        DB::transaction(function () use ($stageIds, $module): void {
            foreach ($stageIds as $index => $stageId) {
                ModuleStage::query()
                    ->where('module_id', $module->getKey())
                    ->whereKey($stageId)
                    ->update(['order' => $index + 1]);
            }

            $this->normalizeModuleStageOrder($module);
        });

        return redirect()
            ->route('courses.modules.contents.index', [$course, $module])
            ->with('flash.success', 'Urutan konten berhasil disimpan.');
    }

    private function deleteModuleQuiz(?Quiz $quiz, ?ModuleStage $excludingStage = null): void {
        if (!$quiz) {
            return;
        }

        $query = ModuleStage::query()
            ->where('module_able_type', Quiz::class)
            ->where('module_able_id', $quiz->getKey());

        if ($excludingStage) {
            $query->whereKeyNot($excludingStage->getKey());
        }

        if ($query->exists()) {
            return;
        }

        $quiz->loadMissing('quiz_questions.quiz_question_options');

        $questionImagesToDelete = collect($quiz->quiz_questions)
            ->pluck('question_image')
            ->filter(fn ($path) => is_string($path) && trim($path) !== '')
            ->unique();

        $optionImagesToDelete = collect($quiz->quiz_questions)
            ->flatMap(fn (QuizQuestion $question) => collect($question->quiz_question_options)->pluck('option_image'))
            ->filter(fn ($path) => is_string($path) && trim($path) !== '')
            ->unique();

        foreach ($questionImagesToDelete as $path) {
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }

        foreach ($optionImagesToDelete as $path) {
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }

        $quiz->quiz_questions()->delete();
        $quiz->delete();
    }

    private function attachQuizUploads(array $quizPayload, Request $request, string $inputPrefix): array {
        $questions = $quizPayload['questions'] ?? [];

        foreach ($questions as $questionIndex => $question) {
            $questionFile = $request->file("$inputPrefix.questions.$questionIndex.question_image");

            if ($questionFile instanceof UploadedFile) {
                $quizPayload['questions'][$questionIndex]['question_image'] = $questionFile;
            }

            $options = $question['options'] ?? [];

            foreach ($options as $optionIndex => $option) {
                $file = $request->file("$inputPrefix.questions.$questionIndex.options.$optionIndex.option_image");

                if ($file instanceof UploadedFile) {
                    $quizPayload['questions'][$questionIndex]['options'][$optionIndex]['option_image'] = $file;
                }
            }
        }

        return $quizPayload;
    }

    private function resolveContentType(?UploadedFile $file, ?string $providedType, ?string $path = null, ?string $fallback = null): ?string {
        $normalizedProvided = $this->normalizeContentType($providedType);

        if ($file) {
            return $normalizedProvided
                ?? $this->detectContentType($file->getMimeType(), $file->getClientOriginalExtension())
                ?? $fallback;
        }

        if ($normalizedProvided !== null) {
            return $normalizedProvided;
        }

        if ($path) {
            $extension = pathinfo($path, PATHINFO_EXTENSION);
            $detected = $this->detectContentType(null, $extension);
            if ($detected !== null) {
                return $detected;
            }
        }

        return $fallback;
    }

    private function normalizeContentType(?string $value): ?string {
        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function detectContentType(?string $mime, ?string $extension): ?string {
        $mime = $mime ? strtolower($mime) : '';
        $extension = $extension ? strtolower($extension) : null;

        if ($mime !== '') {
            if (str_contains($mime, 'video')) {
                return 'Video';
            }

            if (str_contains($mime, 'audio')) {
                return 'Audio';
            }

            if (str_contains($mime, 'image')) {
                return 'Gambar';
            }

            if (str_contains($mime, 'pdf')) {
                return 'PDF';
            }
        }

        if ($extension !== null) {
            if (in_array($extension, ['mp4', 'mov', 'mkv', 'webm', 'avi'], true)) {
                return 'Video';
            }

            if (in_array($extension, ['mp3', 'wav', 'ogg', 'm4a', 'flac'], true)) {
                return 'Audio';
            }

            if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'avif'], true)) {
                return 'Gambar';
            }

            if ($extension === 'pdf') {
                return 'PDF';
            }

            if (in_array($extension, ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf', 'zip'], true)) {
                return 'Dokumen';
            }
        }

        return null;
    }

    private function normalizeModuleStageOrder(Module $module): void {
        $stages = ModuleStage::query()
            ->where('module_id', $module->getKey())
            ->orderBy('order')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        foreach ($stages as $index => $item) {
            $expectedOrder = $index + 1;
            if ((int) $item->order !== $expectedOrder) {
                $item->update([
                    'order' => $expectedOrder,
                ]);
            }
        }
    }

    private function deleteModuleContent(?ModuleContent $content): void {
        if (!$content) {
            return;
        }

        if ($content->file_path && Storage::disk('public')->exists($content->file_path)) {
            Storage::disk('public')->delete($content->file_path);
        }

        $content->delete();
    }
}
