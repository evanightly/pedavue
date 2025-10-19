<?php

namespace App\Http\Controllers;

use App\Data\Course\CourseData;
use App\Data\EnrollmentRequest\EnrollmentRequestData;
use App\Data\Module\ModuleData;
use App\Data\User\UserData;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\EnrollmentRequest;
use App\Models\User;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use App\Support\Enums\EnrollmentRequestEnum;
use App\Support\Enums\PermissionEnum;
use App\Support\Enums\RoleEnum;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class CourseController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = Course::class;
    protected array $allowedFilters = ['certification_enabled', 'created_at', 'description', 'duration', 'level', 'search', 'slug', 'thumbnail', 'title', 'updated_at'];
    protected array $allowedSorts = ['certification_enabled', 'created_at', 'description', 'duration', 'id', 'level', 'slug', 'thumbnail', 'title', 'updated_at'];
    protected array $allowedIncludes = ['Certificates', 'Enrollments', 'course_instructors', 'Modules', 'Quizzes'];
    protected array $defaultIncludes = ['course_instructors'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(Course::class, 'course', ['except' => ['show']]);
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

        $user = $request->user();
        if ($user && $user->hasRole(RoleEnum::Student->value) && !$user->hasPermissionTo(PermissionEnum::ReadCourse)) {
            $query->whereHas('students', static function ($relation) use ($user): void {
                $relation->where('users.id', $user->getKey());
            });
        }

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

    public function explore(Request $request): Response|JsonResponse {
        $user = $request->user();

        if ($user && !$user->hasRole(RoleEnum::Student->value)) {
            abort(403);
        }

        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 9);
        if ($perPage < 1 || $perPage > 24) {
            $perPage = 9;
        }

        $query = Course::query()
            ->with('course_instructors');

        if ($user) {
            $query
                ->whereDoesntHave('students', static function ($relation) use ($user): void {
                    $relation->where('users.id', $user->getKey());
                })
                ->whereDoesntHave('enrollment_requests', static function ($relation) use ($user): void {
                    $relation
                        ->where('user_id', $user->getKey())
                        ->where('status', EnrollmentRequestEnum::Pending);
                });
        }

        if ($search !== '') {
            $query->where(static function ($relation) use ($search): void {
                $relation
                    ->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        $coursesPaginator = $query
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->appends($request->query());

        $courses = CourseData::collect($coursesPaginator);

        return $this->respond($request, 'course/explore', [
            'courses' => $courses,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response {
        return Inertia::render('course/create');
    }

    public function show(Request $request, Course $course): Response {
        $course->load([
            'course_instructors',
            'students',
            'modules.module_stages.module_content',
            'modules.module_stages.module_quiz',
        ]);

        $user = $request->user();
        $viewer = null;

        if ($user) {
            $isStudent = $user->hasRole(RoleEnum::Student->value);
            $isEnrolled = $course->relationLoaded('students')
                ? $course->students->contains('id', $user->getKey())
                : $course->students()->where('users.id', $user->getKey())->exists();

            $latestRequest = null;

            if ($isStudent) {
                $latestRequest = $course->enrollment_requests()
                    ->where('user_id', $user->getKey())
                    ->latest()
                    ->first();
            }

            $viewer = [
                'is_student' => $isStudent,
                'is_enrolled' => $isEnrolled,
                'can_request_enrollment' => $isStudent && !$isEnrolled && ($latestRequest === null || $latestRequest->isRejected()),
                'latest_request' => $latestRequest ? EnrollmentRequestData::fromModel($latestRequest)->toArray() : null,
            ];
        }

        return Inertia::render('course/show', [
            'record' => CourseData::fromModel($course)->toArray(),
            'modules' => ModuleData::collect($course->modules)->toArray(),
            'abilities' => [
                'assign_students' => $user?->can('assignStudents', $course) ?? false,
                'unassign_students' => $user?->can('assignStudents', $course) ?? false,
                'manage_modules' => $user?->can('update', $course) ?? false,
            ],
            'viewer' => $viewer,
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

        // assign instructor role if not assigned
        $instructor = User::find($payload['instructor_id']);
        if ($instructor && !$instructor->hasRole(RoleEnum::Instructor->value)) {
            $instructor->assignRole(RoleEnum::Instructor->value);
        }

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

    public function students(Request $request, Course $course): Response|JsonResponse {
        $this->authorize('assignStudents', $course);

        $rawFilter = $request->input('filter', []);
        $normalizedFilter = [];

        if (is_string($rawFilter)) {
            $normalizedFilter['search'] = trim($rawFilter);
        } elseif (is_array($rawFilter)) {
            foreach ($rawFilter as $key => $value) {
                if (is_string($value)) {
                    $normalizedFilter[$key] = trim($value);
                }
            }
        }

        $request->merge([
            'filter' => array_filter($normalizedFilter, static fn ($value) => $value !== ''),
        ]);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $studentsPaginator = QueryBuilder::for(
            User::query()
                ->role(RoleEnum::Student->value)
                ->whereDoesntHave('enrollments', static function ($relation) use ($course): void {
                    $relation->where('course_id', $course->getKey());
                }),
            $request,
        )
            ->allowedFilters([
                AllowedFilter::callback('search', static function ($query, $value): void {
                    $term = is_string($value) ? trim($value) : null;

                    if ($term === null || $term === '') {
                        return;
                    }

                    $query->where(static function ($relation) use ($term): void {
                        $relation
                            ->where('name', 'like', '%' . $term . '%')
                            ->orWhere('email', 'like', '%' . $term . '%');
                    });
                }),
                AllowedFilter::partial('name'),
                AllowedFilter::partial('email'),
            ])
            ->allowedSorts([
                AllowedSort::field('name'),
                AllowedSort::field('email'),
                AllowedSort::field('created_at'),
                AllowedSort::field('updated_at'),
            ])
            ->defaultSort('name')
            ->paginate($perPage)
            ->appends($request->query());

        $students = UserData::collect($studentsPaginator);

        $course->load('course_instructors');

        return $this->respond($request, 'course/assign-students', [
            'course' => CourseData::fromModel($course)->toArray(),
            'students' => $students,
            'filters' => [
                'search' => $request->input('filter.search', ''),
                'name' => $request->input('filter.name'),
                'email' => $request->input('filter.email'),
            ],
            'filteredData' => null,
            'sort' => $request->query('sort'),
            'abilities' => [
                'assign_students' => true,
            ],
        ]);
    }

    public function assignStudents(Request $request, Course $course): RedirectResponse|JsonResponse {
        $this->authorize('assignStudents', $course);

        $payload = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer'],
        ]);

        $userIds = collect($payload['user_ids'] ?? [])
            ->filter(static fn ($id) => $id !== null && $id !== '')
            ->map(static fn ($id) => (int) $id)
            ->filter(static fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($userIds->isEmpty()) {
            return $this->assignmentResponse($request, $course, 0, 0);
        }

        $students = User::query()
            ->whereIn('id', $userIds->all())
            ->role(RoleEnum::Student->value)
            ->whereDoesntHave('enrollments', static function ($relation) use ($course): void {
                $relation->where('course_id', $course->getKey());
            })
            ->get();

        $created = 0;
        foreach ($students as $student) {
            $enrollment = Enrollment::firstOrCreate(
                [
                    'user_id' => $student->getKey(),
                    'course_id' => $course->getKey(),
                ],
                [
                    'progress' => 0,
                    'completed_at' => null,
                ],
            );

            if ($enrollment->wasRecentlyCreated) {
                $created++;
            }
        }

        return $this->assignmentResponse($request, $course, $created, $students->count());
    }

    public function unassignStudent(Request $request, Course $course, User $student): RedirectResponse|JsonResponse {
        $this->authorize('assignStudents', $course);

        $enrollment = Enrollment::query()
            ->where('course_id', $course->getKey())
            ->where('user_id', $student->getKey())
            ->first();

        if ($enrollment === null) {
            return $this->unassignResponse($request, $course, false);
        }

        $enrollment->delete();

        return $this->unassignResponse($request, $course, true);
    }

    public function requestEnrollment(Request $request, Course $course): RedirectResponse|JsonResponse {
        $user = $request->user();

        if (!$user || !$user->hasRole(RoleEnum::Student->value)) {
            abort(403);
        }

        $payload = $request->validate([
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $message = isset($payload['message']) ? trim((string) $payload['message']) : null;
        if ($message === '') {
            $message = null;
        }

        $isAlreadyEnrolled = $course->students()
            ->where('users.id', $user->getKey())
            ->exists();

        if ($isAlreadyEnrolled) {
            return $this->enrollmentRequestResponse($request, $course, 'Anda sudah terdaftar pada kursus ini.', 'flash.info');
        }

        $latestRequest = $course->enrollment_requests()
            ->where('user_id', $user->getKey())
            ->latest()
            ->first();

        if ($latestRequest !== null) {
            if ($latestRequest->isPending()) {
                return $this->enrollmentRequestResponse($request, $course, 'Permintaan pendaftaran Anda sedang diproses.', 'flash.info', $latestRequest);
            }

            if ($latestRequest->isApproved()) {
                return $this->enrollmentRequestResponse($request, $course, 'Permintaan pendaftaran sudah disetujui.', 'flash.info', $latestRequest);
            }
        }

        $enrollmentRequest = $course->enrollment_requests()->create([
            'user_id' => $user->getKey(),
            'message' => $message,
            'status' => EnrollmentRequestEnum::Pending,
        ]);

        return $this->enrollmentRequestResponse($request, $course, 'Permintaan pendaftaran berhasil dikirim.', 'flash.success', $enrollmentRequest);
    }

    private function enrollmentRequestResponse(Request $request, Course $course, string $message, string $flashKey, ?EnrollmentRequest $enrollmentRequest = null): RedirectResponse|JsonResponse {
        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message,
                'enrollment_request' => $enrollmentRequest ? EnrollmentRequestData::fromModel($enrollmentRequest)->toArray() : null,
            ]);
        }

        return redirect()
            ->route('courses.show', $course)
            ->with($flashKey, $message);
    }

    private function assignmentResponse(Request $request, Course $course, int $createdCount, int $attemptedCount): RedirectResponse|JsonResponse {
        $message = $createdCount > 0
            ? sprintf('%d siswa berhasil ditambahkan ke kursus.', $createdCount)
            : 'Tidak ada siswa baru yang ditambahkan.';

        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message,
                'created_count' => $createdCount,
                'processed_count' => $attemptedCount,
            ]);
        }

        $flashKey = $createdCount > 0 ? 'flash.success' : 'flash.info';

        return redirect()
            ->route('courses.students.index', $course)
            ->with($flashKey, $message);
    }

    private function unassignResponse(Request $request, Course $course, bool $removed): RedirectResponse|JsonResponse {
        $message = $removed
            ? 'Siswa berhasil dihapus dari kursus.'
            : 'Siswa tidak ditemukan pada kursus ini.';

        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message,
                'removed' => $removed,
            ]);
        }

        return redirect()
            ->route('courses.show', $course)
            ->with($removed ? 'flash.success' : 'flash.info', $message);
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
