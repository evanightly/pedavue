<?php

namespace App\Http\Controllers;

use App\Data\Course\CourseData;
use App\Models\Course;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;

class CourseController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = Course::class;
    protected array $allowedFilters = ['certification_enabled', 'created_at', 'description', 'duration', 'level', 'search', 'slug', 'thumbnail', 'title', 'updated_at'];
    protected array $allowedSorts = ['certification_enabled', 'created_at', 'description', 'duration', 'id', 'level', 'slug', 'thumbnail', 'title', 'updated_at'];
    protected array $allowedIncludes = ['Certificates', 'Enrollments', 'course_instructors', 'Modules', 'Quizzes'];
    protected array $defaultIncludes = ['course_instructors'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(Course::class, 'course');
    }

    protected function filters(): array {
        return [
            'certification_enabled',
            'description',
            'duration',
            'level',
            'slug',
            'thumbnail',
            'title',
            MultiColumnSearchFilter::make(['description', 'duration', 'level', 'slug', 'thumbnail', 'title']),
            DateRangeFilter::make('created_at'),
            DateRangeFilter::make('updated_at'),
            AllowedFilter::callback('instructor_id', static function ($query, $value): void {
                $ids = collect($value)
                    ->flatMap(static fn ($item) => is_array($item) ? $item : [$item])
                    ->filter(static fn ($item) => $item !== null && $item !== '')
                    ->map(static fn ($item) => (int) $item)
                    ->filter(static fn ($item) => $item > 0)
                    ->unique()
                    ->all();

                if (empty($ids)) {
                    return;
                }

                $query->whereHas('course_instructors', static function ($relation) use ($ids): void {
                    $relation->whereIn('users.id', $ids);
                });
            }),
        ];
    }

    public function index(Request $request): Response|JsonResponse {
        $filteredData = [];

        $query = $this->buildIndexQuery($request);

        $items = $query
            ->paginate($request->input('per_page'))
            ->appends($request->query());

        $courses = CourseData::collect($items);

        return $this->respond($request, 'course/index', [
            'courses' => $courses,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }

    public function create(): Response {
        return Inertia::render('course/create');
    }

    public function show(Course $course): Response {
        return Inertia::render('course/show', [
            'record' => CourseData::fromModel($course->load('course_instructors'))->toArray(),
        ]);
    }

    public function edit(Course $course): Response {
        return Inertia::render('course/edit', [
            'record' => CourseData::fromModel($course->load('course_instructors'))->toArray(),
        ]);
    }

    public function store(CourseData $courseData): RedirectResponse {
        $data = $courseData->toArray();

        $instructorIds = collect($data['instructor_ids'] ?? [])
            ->map(static fn ($id) => (int) $id)
            ->filter(static fn ($id) => $id > 0)
            ->unique()
            ->values();

        unset($data['instructor_ids']);

        $data = $this->sanitizeCertificateSettings($data);

        // Handle thumbnail file upload
        if (request()->hasFile('thumbnail')) {
            $file = request()->file('thumbnail');
            $path = $file->store('courses/thumbnails', 'public');
            $data['thumbnail'] = $path;
        }

        if (request()->hasFile('certificate_template')) {
            $file = request()->file('certificate_template');
            $path = $file->store('courses/certificates/templates', 'public');
            $data['certificate_template'] = $path;
        }

        $course = Course::create($data);

        if ($instructorIds->isNotEmpty()) {
            $course->course_instructors()->sync($instructorIds->all());
        }

        return redirect()
            ->route('courses.index', $course)
            ->with('flash.success', 'Course created.');
    }

    public function update(CourseData $courseData, Course $course): RedirectResponse {
        $data = $courseData->toArray();

        $instructorIds = collect($data['instructor_ids'] ?? [])
            ->map(static fn ($id) => (int) $id)
            ->filter(static fn ($id) => $id > 0)
            ->unique()
            ->values();

        unset($data['instructor_ids']);

        $data = $this->sanitizeCertificateSettings($data);

        // Handle thumbnail file upload
        if (request()->hasFile('thumbnail')) {
            // Delete old thumbnail if exists
            if ($course->thumbnail && Storage::disk('public')->exists($course->thumbnail)) {
                Storage::disk('public')->delete($course->thumbnail);
            }

            $file = request()->file('thumbnail');
            $path = $file->store('courses/thumbnails', 'public');
            $data['thumbnail'] = $path;
        } else {
            // Don't update thumbnail if no new file was uploaded
            unset($data['thumbnail']);
        }

        if (request()->hasFile('certificate_template')) {
            if ($course->certificate_template && Storage::disk('public')->exists($course->certificate_template)) {
                Storage::disk('public')->delete($course->certificate_template);
            }

            $file = request()->file('certificate_template');
            $path = $file->store('courses/certificates/templates', 'public');
            $data['certificate_template'] = $path;
        } else {
            unset($data['certificate_template']);
        }

        $course->update($data);

        $course->course_instructors()->sync($instructorIds->all());

        return redirect()
            ->route('courses.index', $course)
            ->with('flash.success', 'Course updated.');
    }

    public function attachInstructor(Request $request, Course $course): RedirectResponse {
        $this->authorize('update', $course);

        $payload = $request->validate([
            'instructor_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $course->course_instructors()->syncWithoutDetaching([$payload['instructor_id']]);

        return redirect()
            ->route('courses.show', $course)
            ->with('flash.success', 'Instruktur berhasil ditambahkan.');
    }

    public function detachInstructor(Course $course, int $instructor): RedirectResponse {
        $this->authorize('update', $course);

        $currentCount = $course->course_instructors()->count();

        if ($currentCount <= 1) {
            return redirect()
                ->route('courses.show', $course)
                ->with('flash.error', 'Kursus harus memiliki minimal satu instruktur.');
        }

        $course->course_instructors()->detach($instructor);

        return redirect()
            ->route('courses.show', $course)
            ->with('flash.success', 'Instruktur berhasil dihapus.');
    }

    private function sanitizeCertificateSettings(array $data): array {
        $data['certification_enabled'] = (bool) ($data['certification_enabled'] ?? false);

        $data['certificate_name_position_x'] = isset($data['certificate_name_position_x'])
            ? max(0, min(100, (int) $data['certificate_name_position_x']))
            : null;
        $data['certificate_name_position_y'] = isset($data['certificate_name_position_y'])
            ? max(0, min(100, (int) $data['certificate_name_position_y']))
            : null;
        $data['certificate_name_max_length'] = isset($data['certificate_name_max_length'])
            ? max(1, min(255, (int) $data['certificate_name_max_length']))
            : null;
        $data['certificate_name_box_width'] = isset($data['certificate_name_box_width'])
            ? max(10, min(100, (int) $data['certificate_name_box_width']))
            : null;
        $data['certificate_name_box_height'] = isset($data['certificate_name_box_height'])
            ? max(10, min(100, (int) $data['certificate_name_box_height']))
            : null;

        $allowedFontFamilies = ['Poppins', 'Montserrat', 'Playfair Display', 'Roboto', 'Lora'];
        $allowedFontWeights = ['400', '500', '600', '700', '800'];
        $allowedAlignments = ['left', 'center', 'right'];

        $fontFamily = $data['certificate_name_font_family'] ?? null;
        $data['certificate_name_font_family'] = $fontFamily && in_array($fontFamily, $allowedFontFamilies, true)
            ? $fontFamily
            : null;

        $fontWeight = $data['certificate_name_font_weight'] ?? null;
        $data['certificate_name_font_weight'] = $fontWeight && in_array($fontWeight, $allowedFontWeights, true)
            ? $fontWeight
            : null;

        $textAlign = $data['certificate_name_text_align'] ?? null;
        $data['certificate_name_text_align'] = $textAlign && in_array($textAlign, $allowedAlignments, true)
            ? $textAlign
            : null;

        $textColor = $data['certificate_name_text_color'] ?? null;
        if ($textColor && is_string($textColor) && preg_match('/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/', $textColor)) {
            $data['certificate_name_text_color'] = strtoupper($textColor);
        } else {
            $data['certificate_name_text_color'] = null;
        }

        $data['certificate_name_letter_spacing'] = isset($data['certificate_name_letter_spacing'])
            ? max(-10, min(20, (int) $data['certificate_name_letter_spacing']))
            : null;

        if (!$data['certification_enabled']) {
            $data['certificate_name_position_x'] = null;
            $data['certificate_name_position_y'] = null;
            $data['certificate_name_max_length'] = null;
            $data['certificate_name_box_width'] = null;
            $data['certificate_name_box_height'] = null;
            $data['certificate_name_font_family'] = null;
            $data['certificate_name_font_weight'] = null;
            $data['certificate_name_text_align'] = null;
            $data['certificate_name_text_color'] = null;
            $data['certificate_name_letter_spacing'] = null;
        }

        return $data;
    }

    public function destroy(Course $course): RedirectResponse {
        $course->delete();

        return redirect()
            ->route('courses.index')
            ->with('flash.success', 'Course deleted.');
    }

    public function bulkDelete(Request $request): JsonResponse {
        $this->authorize('deleteAny', Course::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = Course::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }
}
