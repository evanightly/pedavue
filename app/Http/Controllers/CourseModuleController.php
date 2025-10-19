<?php

namespace App\Http\Controllers;

use App\Http\Requests\CourseModule\StoreCourseModuleRequest;
use App\Models\Course;
use App\Models\Module;
use App\Models\ModuleContent;
use App\Models\ModuleStage;
use App\Models\Quiz;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CourseModuleController extends Controller {
    use AuthorizesRequests;

    public function create(Request $request, Course $course): Response {
        $this->authorize('update', $course);

        $quizzes = Quiz::query()
            ->select(['id', 'name', 'duration'])
            ->orderBy('name')
            ->get()
            ->map(static fn (Quiz $quiz): array => [
                'id' => $quiz->getKey(),
                'name' => $quiz->name,
                'duration' => $quiz->duration,
            ]);

        return Inertia::render('course/module/create', [
            'course' => [
                'id' => $course->getKey(),
                'title' => $course->title,
                'slug' => $course->slug,
            ],
            'quizzes' => $quizzes,
        ]);
    }

    public function store(StoreCourseModuleRequest $request, Course $course): RedirectResponse {
        $this->authorize('update', $course);

        $payload = $request->validated();

        $stages = collect($payload['stages'] ?? [])
            ->map(static function (array $stage, int $index): array {
                $type = $stage['type'];

                return [
                    'type' => $type,
                    'order' => isset($stage['order']) ? (int) $stage['order'] : $index + 1,
                    'quiz_id' => $type === 'quiz' && isset($stage['quiz_id']) ? (int) $stage['quiz_id'] : null,
                    'content' => $type === 'content' ? [
                        'title' => Arr::get($stage, 'content.title'),
                        'description' => Arr::get($stage, 'content.description'),
                        'content_type' => Arr::get($stage, 'content.content_type'),
                        'duration' => Arr::has($stage, 'content.duration')
                            ? (int) Arr::get($stage, 'content.duration')
                            : null,
                        'content_url' => Arr::get($stage, 'content.content_url'),
                        'file_path' => Arr::get($stage, 'content.file_path'),
                    ] : null,
                ];
            });

        DB::transaction(function () use ($course, $request, $payload, $stages): void {
            $moduleOrder = $payload['order'] ?? null;
            if ($moduleOrder === null) {
                $maxExistingOrder = $course->modules()->max('order');
                $moduleOrder = $maxExistingOrder ? $maxExistingOrder + 1 : 1;
            }

            $module = Module::query()->create([
                'title' => $payload['title'],
                'description' => $payload['description'] ?? null,
                'thumbnail' => null,
                'duration' => $payload['duration'] ?? null,
                'order' => (int) $moduleOrder,
                'course_id' => $course->getKey(),
            ]);

            if ($request->hasFile('thumbnail')) {
                $thumbnailPath = $request->file('thumbnail')->store('courses/modules/thumbnails', 'public');
                $module->update(['thumbnail' => $thumbnailPath]);
            }

            $stages->each(function (array $stage, int $index) use ($module, $request): void {
                $moduleStage = ModuleStage::query()->create([
                    'module_id' => $module->getKey(),
                    'module_able' => $stage['type'],
                    'order' => $stage['order'] ?? $index + 1,
                ]);

                if ($stage['type'] === 'content' && $stage['content'] !== null) {
                    $file = $request->file("stages.$index.content.file");
                    $storedPath = null;

                    if ($file) {
                        $storedPath = $file->store('courses/modules/contents', 'public');
                    } elseif (!empty($stage['content']['file_path'])) {
                        $storedPath = $stage['content']['file_path'];
                    }

                    $contentType = $this->resolveContentType(
                        $file,
                        Arr::get($stage['content'], 'content_type'),
                        $storedPath,
                        $file ? 'Berkas' : null
                    );

                    $moduleContent = ModuleContent::query()->create([
                        'title' => $stage['content']['title'],
                        'description' => $stage['content']['description'],
                        'file_path' => $storedPath,
                        'content_url' => $stage['content']['content_url'],
                        'duration' => $stage['content']['duration'],
                        'content_type' => $contentType,
                        'module_stage_id' => $moduleStage->getKey(),
                    ]);

                    $moduleStage->update([
                        'module_able' => 'content',
                        'module_content_id' => $moduleContent->getKey(),
                        'module_quiz_id' => null,
                    ]);
                }

                if ($stage['type'] === 'quiz' && $stage['quiz_id'] !== null) {
                    $moduleStage->update([
                        'module_able' => 'quiz',
                        'module_quiz_id' => $stage['quiz_id'],
                        'module_content_id' => null,
                    ]);
                }
            });
        });

        return redirect()
            ->route('courses.show', $course)
            ->with('flash.success', 'Modul berhasil dibuat.');
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
}
