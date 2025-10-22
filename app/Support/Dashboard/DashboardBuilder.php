<?php

namespace App\Support\Dashboard;

use App\Data\Dashboard\ChartDistributionData;
use App\Data\Dashboard\ChartSegmentData;
use App\Data\Dashboard\CourseProgressSummaryData;
use App\Data\Dashboard\CourseStudentProgressData;
use App\Data\Dashboard\DashboardData;
use App\Data\Dashboard\InstructorDashboardData;
use App\Data\Dashboard\StudentDashboardData;
use App\Data\Dashboard\SuperAdminDashboardData;
use App\Data\ModuleStageProgress\ModuleStageProgressData;
use App\Data\User\UserData;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\ModuleStageProgress;
use App\Models\User;
use App\Support\Enums\ModuleStageProgressStatus;
use App\Support\Enums\RoleEnum;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Spatie\LaravelData\DataCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class DashboardBuilder {
    private const DEFAULT_USER_RANGE = '90_days';
    private const DEFAULT_COURSE_RANGE = '180_days';

    /**
     * @var array<string, string>
     */
    private const RANGE_OPTIONS = [
        '30_days' => '30 Hari Terakhir',
        '90_days' => '90 Hari Terakhir',
        '180_days' => '6 Bulan Terakhir',
        '365_days' => '12 Bulan Terakhir',
        'all' => 'Semua Waktu',
    ];

    /**
     * @var array<string, string>
     */
    private const ROLE_COLORS = [
        RoleEnum::Admin->value => 'hsl(var(--chart-1))',
        RoleEnum::Instructor->value => 'hsl(var(--chart-2))',
        RoleEnum::Student->value => 'hsl(var(--chart-3))',
    ];

    private Request $request;

    private User $user;

    /**
     * @var array<string, mixed>
     */
    private array $filters;

    public function __construct(Request $request, User $user) {
        $this->request = $request;
        $this->user = $user->loadMissing('roles');
        $this->filters = $this->normalizeFilters($request->input('filter', []));
        $this->request->merge(['filter' => $this->filters]);
    }

    public function build(): DashboardData {
        $roleNames = $this->user->roles->pluck('name')->values()->all();

        $superAdminData = null;
        if ($this->user->hasRole(RoleEnum::SuperAdmin->value)) {
            $superAdminData = $this->buildSuperAdminData();
        }

        $instructorData = null;
        if ($this->user->hasRole(RoleEnum::Instructor->value)) {
            $instructorData = $this->buildInstructorData();
        }

        $studentData = null;
        if ($this->user->hasRole(RoleEnum::Student->value)) {
            $studentData = $this->buildStudentData();
        }

        return new DashboardData(
            user: UserData::fromModel($this->user),
            role_names: $roleNames,
            super_admin: $superAdminData,
            instructor: $instructorData,
            student: $studentData,
            filters: $this->filters,
        );
    }

    private function buildSuperAdminData(): SuperAdminDashboardData {
        $userRange = $this->resolveRange($this->filters['user_range'] ?? null, self::DEFAULT_USER_RANGE);
        $courseRange = $this->resolveRange($this->filters['course_range'] ?? null, self::DEFAULT_COURSE_RANGE);
        $courseLevelFilter = $this->normalizeArrayValue($this->filters['course_level'] ?? []);

        $userQuery = QueryBuilder::for(
            User::query()->with('roles'),
            $this->request,
        )
            ->allowedFilters([
                AllowedFilter::callback('user_range', function (Builder $query, mixed $value): void {
                    $this->applyDateRangeFilter($query, $this->resolveRange($value, self::DEFAULT_USER_RANGE), 'created_at');
                }),
            ]);

        if (!$this->request->has('filter.user_range')) {
            $this->applyDateRangeFilter($userQuery, $userRange, 'created_at');
        }

        $users = $userQuery->get();

        $roleCounts = [
            RoleEnum::Admin->value => 0,
            RoleEnum::Instructor->value => 0,
            RoleEnum::Student->value => 0,
        ];

        foreach ($users as $user) {
            foreach (array_keys($roleCounts) as $roleName) {
                if ($user->roles->contains('name', $roleName)) {
                    $roleCounts[$roleName]++;
                }
            }
        }

        $userRoleSegments = collect($roleCounts)
            ->map(function (int $count, string $role) {
                return new ChartSegmentData(
                    key: Str::slug($role),
                    label: $this->localizedRoleLabel($role),
                    value: $count,
                    color: self::ROLE_COLORS[$role] ?? null,
                );
            })
            ->values();

        $userRolesChart = new ChartDistributionData(
            title: 'Distribusi Pengguna Berdasarkan Peran',
            description: 'Periode: ' . $this->rangeLabel($userRange),
            segments: new DataCollection(ChartSegmentData::class, $userRoleSegments->all()),
            meta: [
                'total' => $users->count(),
                'range' => $userRange,
                'range_label' => $this->rangeLabel($userRange),
            ],
        );

        $courseQuery = QueryBuilder::for(Course::query(), $this->request)
            ->allowedFilters([
                AllowedFilter::callback('course_range', function (Builder $query, mixed $value): void {
                    $this->applyDateRangeFilter($query, $this->resolveRange($value, self::DEFAULT_COURSE_RANGE), 'created_at');
                }),
                AllowedFilter::callback('course_level', function (Builder $query, mixed $value): void {
                    $levels = $this->normalizeArrayValue($value);

                    if ($levels === []) {
                        return;
                    }

                    $query->whereIn($query->qualifyColumn('level'), $levels);
                }),
            ]);

        if (!$this->request->has('filter.course_range')) {
            $this->applyDateRangeFilter($courseQuery, $courseRange, 'created_at');
        }

        if ($courseLevelFilter !== []) {
            $courseQuery->whereIn($courseQuery->qualifyColumn('level'), $courseLevelFilter);
        }

        $courses = $courseQuery->get();

        $levelCounts = $courses
            ->groupBy(static fn (Course $course): string => $course->level ?? 'Tanpa Level')
            ->map(static fn (Collection $group): int => $group->count());

        $courseColors = [
            '#4f46e5',
            '#0ea5e9',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#6366f1',
            '#14b8a6',
        ];

        $courseSegments = $levelCounts
            ->values()
            ->map(function (int $count, int $index) use ($levelCounts, $courseColors) {
                $level = $levelCounts->keys()->get($index, 'Tanpa Level');

                return new ChartSegmentData(
                    key: Str::slug($level) ?: 'tanpa-level',
                    label: $this->formatCourseLevelLabel($level),
                    value: $count,
                    color: $courseColors[$index % count($courseColors)],
                );
            });

        $courseChart = new ChartDistributionData(
            title: 'Distribusi Kursus Berdasarkan Level',
            description: 'Periode: ' . $this->rangeLabel($courseRange),
            segments: new DataCollection(ChartSegmentData::class, $courseSegments->all()),
            meta: [
                'total' => $courses->count(),
                'range' => $courseRange,
                'range_label' => $this->rangeLabel($courseRange),
                'selected_levels' => $courseLevelFilter,
            ],
        );

        return new SuperAdminDashboardData(
            user_roles: $userRolesChart,
            course_levels: $courseChart,
            filters: [
                'user_range' => [
                    'options' => $this->rangeOptions(),
                    'selected' => $userRange,
                ],
                'course_range' => [
                    'options' => $this->rangeOptions(),
                    'selected' => $courseRange,
                ],
                'course_level' => [
                    'options' => $this->courseLevelOptions(),
                    'selected' => $courseLevelFilter,
                ],
            ],
        );
    }

    private function buildInstructorData(): InstructorDashboardData {
        $courses = $this->user->courses()->select('courses.id', 'courses.title')->orderBy('courses.title')->get();
        $availableCourseIds = $courses->pluck('id')->map(static fn ($id) => (int) $id)->all();

        $selectedCourseIds = array_values(array_intersect(
            $this->normalizeIdArray($this->filters['instructor_course_ids'] ?? []),
            $availableCourseIds,
        ));

        $enrollmentQuery = QueryBuilder::for(
            Enrollment::query()
                ->with(['user:id,name,email', 'course:id,title'])
                ->whereHas('course.course_instructors', function (Builder $query): void {
                    $query->where('users.id', $this->user->getKey());
                }),
            $this->request,
        )
            ->allowedFilters([
                AllowedFilter::callback('instructor_course_ids', function (Builder $query, mixed $value): void {
                    $courseIds = $this->normalizeIdArray($value);

                    if ($courseIds === []) {
                        return;
                    }

                    $query->whereIn($query->qualifyColumn('course_id'), $courseIds);
                }),
            ])
            ->defaultSort('-created_at');

        if ($selectedCourseIds !== [] && !$this->request->has('filter.instructor_course_ids')) {
            $enrollmentQuery->whereIn($enrollmentQuery->qualifyColumn('course_id'), $selectedCourseIds);
        }

        $enrollments = $enrollmentQuery->get();

        $courseSummaries = $enrollments
            ->groupBy(static fn (Enrollment $enrollment) => $enrollment->course?->getKey())
            ->filter()
            ->map(function (Collection $group, int $courseId) use ($courses) {
                /** @var Course|null $course */
                $course = $group->first()->course;
                $courseTitle = $course?->title ?? 'Tanpa Judul';

                $students = $group->map(function (Enrollment $enrollment) {
                    $status = $this->resolveEnrollmentStatus($enrollment);

                    return new CourseStudentProgressData(
                        student_id: (int) $enrollment->user_id,
                        student_name: $enrollment->user?->name ?? 'Tanpa Nama',
                        student_email: $enrollment->user?->email,
                        progress: (int) ($enrollment->progress ?? 0),
                        status: $status,
                    );
                });

                $completed = $students->filter(static fn (CourseStudentProgressData $student) => $student->status === 'completed')->count();
                $inProgress = $students->filter(static fn (CourseStudentProgressData $student) => $student->status === 'in_progress')->count();
                $notStarted = $students->filter(static fn (CourseStudentProgressData $student) => $student->status === 'not_started')->count();

                return new CourseProgressSummaryData(
                    course_id: $courseId,
                    course_title: $courseTitle,
                    total_students: $students->count(),
                    completed_count: $completed,
                    in_progress_count: $inProgress,
                    not_started_count: $notStarted,
                    students: new DataCollection(CourseStudentProgressData::class, $students->values()->all()),
                );
            })
            ->values();

        $uniqueStudents = $enrollments->pluck('user_id')->unique()->filter()->count();

        return new InstructorDashboardData(
            course_progress: new DataCollection(CourseProgressSummaryData::class, $courseSummaries->all()),
            unique_students: $uniqueStudents,
            filters: [
                'course_options' => $courses
                    ->map(fn (Course $course) => [
                        'value' => (string) $course->getKey(),
                        'label' => $course->title,
                    ])
                    ->values()
                    ->all(),
                'selected_course_ids' => array_map(static fn (int $id) => (string) $id, $selectedCourseIds),
            ],
        );
    }

    private function buildStudentData(): StudentDashboardData {
        $courseOptions = $this->user
            ->enrolled_courses()
            ->select('courses.id', 'courses.title')
            ->orderBy('courses.title')
            ->get();

        $selectedCourseId = $this->normalizeId($this->filters['student_course_id'] ?? null);
        $selectedStatus = $this->normalizeScalar($this->filters['student_status'] ?? null);

        $progressQuery = QueryBuilder::for(
            ModuleStageProgress::query()
                ->with([
                    'module_stage.module',
                    'module_stage.module_content',
                    'module_stage.module_quiz',
                    'enrollment.course:id,title',
                ])
                ->whereHas('enrollment', function (Builder $query): void {
                    $query->where($query->qualifyColumn('user_id'), $this->user->getKey());
                }),
            $this->request,
        )
            ->allowedFilters([
                AllowedFilter::callback('student_course_id', function (Builder $query, mixed $value): void {
                    $courseId = $this->normalizeId($value);

                    if ($courseId === null) {
                        return;
                    }

                    $query->whereHas('enrollment', static function (Builder $relation) use ($courseId): void {
                        $relation->where($relation->qualifyColumn('course_id'), $courseId);
                    });
                }),
                AllowedFilter::callback('student_status', function (Builder $query, mixed $value): void {
                    $status = $this->normalizeScalar($value);
                    if ($status === null) {
                        return;
                    }

                    $query->where('status', $status);
                }),
            ])
            ->allowedSorts(['started_at', 'completed_at', 'updated_at'])
            ->defaultSort('-updated_at');

        if ($selectedCourseId !== null && !$this->request->has('filter.student_course_id')) {
            $progressQuery->whereHas('enrollment', static function (Builder $relation) use ($selectedCourseId): void {
                $relation->where($relation->qualifyColumn('course_id'), $selectedCourseId);
            });
        }

        if ($selectedStatus !== null && !$this->request->has('filter.student_status')) {
            $progressQuery->where('status', $selectedStatus);
        }

        $progressItems = $progressQuery
            ->limit(12)
            ->get();

        $completedCount = $progressItems->where('status', ModuleStageProgressStatus::Completed->value)->count();
        $inProgressCount = $progressItems->where('status', ModuleStageProgressStatus::InProgress->value)->count();
        $pendingCount = $progressItems->where('status', ModuleStageProgressStatus::Pending->value)->count();

        $recentProgress = $progressItems
            ->map(fn (ModuleStageProgress $progress) => ModuleStageProgressData::fromModel($progress))
            ->values()
            ->all();

        return new StudentDashboardData(
            recent_progress: new DataCollection(ModuleStageProgressData::class, $recentProgress),
            completed_count: $completedCount,
            in_progress_count: $inProgressCount,
            pending_count: $pendingCount,
            filters: [
                'course_options' => $courseOptions
                    ->map(fn (Course $course) => [
                        'value' => (string) $course->getKey(),
                        'label' => $course->title,
                    ])
                    ->values()
                    ->all(),
                'selected_course_id' => $selectedCourseId !== null ? (string) $selectedCourseId : null,
                'status_options' => collect(ModuleStageProgressStatus::cases())
                    ->map(fn (ModuleStageProgressStatus $status) => [
                        'value' => $status->value,
                        'label' => $this->localizedProgressStatus($status->value),
                    ])
                    ->values()
                    ->all(),
                'selected_status' => $selectedStatus,
            ],
        );
    }

    /**
     * @param  array<string, mixed>|string|null  $raw
     * @return array<string, mixed>
     */
    private function normalizeFilters(mixed $raw): array {
        if (!is_array($raw)) {
            return [];
        }

        $filters = [];

        foreach ($raw as $key => $value) {
            if (is_string($value)) {
                $normalized = $this->normalizeScalar($value);
                if ($normalized !== null) {
                    $filters[$key] = $normalized;
                }

                continue;
            }

            if (is_array($value)) {
                $normalizedArray = $this->normalizeArrayValue($value);
                if ($normalizedArray !== []) {
                    $filters[$key] = $normalizedArray;
                }
            }
        }

        return $filters;
    }

    private function resolveEnrollmentStatus(Enrollment $enrollment): string {
        if ($enrollment->completed_at !== null || ($enrollment->progress ?? 0) >= 100) {
            return 'completed';
        }

        if (($enrollment->progress ?? 0) > 0) {
            return 'in_progress';
        }

        return 'not_started';
    }

    private function rangeLabel(string $range): string {
        return self::RANGE_OPTIONS[$range] ?? self::RANGE_OPTIONS[self::DEFAULT_USER_RANGE];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function rangeOptions(): array {
        return collect(self::RANGE_OPTIONS)
            ->map(fn (string $label, string $value) => [
                'value' => $value,
                'label' => $label,
            ])
            ->values()
            ->all();
    }

    private function localizedRoleLabel(string $role): string {
        return match ($role) {
            RoleEnum::Admin->value => 'Admin',
            RoleEnum::Instructor->value => 'Instruktur',
            RoleEnum::Student->value => 'Siswa',
            default => $role,
        };
    }

    private function localizedProgressStatus(string $status): string {
        return match ($status) {
            ModuleStageProgressStatus::Completed->value => 'Selesai',
            ModuleStageProgressStatus::InProgress->value => 'Sedang Berjalan',
            ModuleStageProgressStatus::Pending->value => 'Belum Dimulai',
            default => Str::headline($status),
        };
    }

    private function formatCourseLevelLabel(string $level): string {
        if ($level === 'Tanpa Level') {
            return 'Tanpa Level';
        }

        return Str::of($level)
            ->replace('_', ' ')
            ->lower()
            ->title()
            ->toString();
    }

    private function applyDateRangeFilter(Builder|QueryBuilder $query, ?string $range, string $column): void {
        if ($range === null || $range === '' || $range === 'all') {
            return;
        }

        $qualifiedColumn = $query->qualifyColumn($column);

        $date = match ($range) {
            '30_days' => Carbon::now()->subDays(30),
            '90_days' => Carbon::now()->subDays(90),
            '180_days' => Carbon::now()->subDays(180),
            '365_days' => Carbon::now()->subDays(365),
            default => null,
        };

        if ($date !== null) {
            $query->where($qualifiedColumn, '>=', $date);
        }
    }

    private function resolveRange(mixed $value, string $default): string {
        $normalized = $this->normalizeScalar($value);
        if ($normalized === null) {
            return $default;
        }

        return array_key_exists($normalized, self::RANGE_OPTIONS) ? $normalized : $default;
    }

    private function normalizeScalar(mixed $value): ?string {
        if (is_string($value)) {
            $trimmed = trim($value);

            return $trimmed !== '' ? $trimmed : null;
        }

        if (is_array($value) && $value !== []) {
            return $this->normalizeScalar(reset($value));
        }

        return null;
    }

    /**
     * @param  mixed  $value
     * @return array<int, string>
     */
    private function normalizeArrayValue(mixed $value): array {
        if (is_array($value)) {
            return collect($value)
                ->map(fn ($item) => $this->normalizeScalar($item))
                ->filter()
                ->values()
                ->all();
        }

        if (is_string($value)) {
            return collect(explode(',', $value))
                ->map(fn (string $item) => $this->normalizeScalar($item))
                ->filter()
                ->values()
                ->all();
        }

        return [];
    }

    /**
     * @param  mixed  $value
     * @return array<int, int>
     */
    private function normalizeIdArray(mixed $value): array {
        return collect($this->normalizeArrayValue($value))
            ->map(static fn (string $item) => (int) $item)
            ->filter(static fn (int $id) => $id > 0)
            ->values()
            ->all();
    }

    private function normalizeId(mixed $value): ?int {
        $scalar = $this->normalizeScalar($value);

        if ($scalar === null) {
            return null;
        }

        $id = (int) $scalar;

        return $id > 0 ? $id : null;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function courseLevelOptions(): array {
        return Course::query()
            ->select('level')
            ->whereNotNull('level')
            ->distinct()
            ->orderBy('level')
            ->get()
            ->map(fn (Course $course) => [
                'value' => $course->level,
                'label' => $this->formatCourseLevelLabel($course->level),
            ])
            ->values()
            ->all();
    }
}
