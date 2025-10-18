<?php

namespace App\Data\Course;

use App\Data\User\UserData;
use App\Models\Course;
use Illuminate\Support\Str;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CourseData extends Data {
    /**
     * @param  array<int, int>|Optional  $instructor_ids
     */
    public function __construct(
        public int|Optional $id,
        #[LiteralTypeScriptType('number[]|null')]
        public array|Optional $instructor_ids,
        // public ?array $module_ids,
        // public ?array $quiz_ids,
        // public ?array $enrollment_ids,
        // public ?array $certificate_ids,
        public ?string $title,
        public string|Optional $slug,
        public ?string $description,
        public bool|Optional $certification_enabled,
        #[Nullable]
        public ?string $thumbnail,
        public ?string $thumbnail_url,
        public ?string $level,
        public ?string $duration,
        public ?string $duration_formatted,
        public ?string $created_at,
        public ?string $created_at_formatted,
        public ?string $updated_at,
        public ?string $updated_at_formatted,
        #[DataCollectionOf(UserData::class)]
        #[LiteralTypeScriptType('App.Data.User.UserData[]|null')]
        public ?DataCollection $course_instructors,
        // #[DataCollectionOf(ModuleData::class)]
        // #[LiteralTypeScriptType('App.Data.Module.ModuleData[]|null')]
        // public ?DataCollection $Modules,
        // #[DataCollectionOf(QuizData::class)]
        // #[LiteralTypeScriptType('App.Data.Quiz.QuizData[]|null')]
        // public ?DataCollection $Quizzes,
        // #[DataCollectionOf(EnrollmentData::class)]
        // #[LiteralTypeScriptType('App.Data.Enrollment.EnrollmentData[]|null')]
        // public ?DataCollection $Enrollments,
        // #[DataCollectionOf(CertificateData::class)]
        // #[LiteralTypeScriptType('App.Data.Certificate.CertificateData[]|null')]
        // public ?DataCollection $Certificates,
    ) {}

    public static function rules(): array {
        return [
            'instructor_ids' => ['required', 'array', 'min:1'],
            'instructor_ids.*' => ['integer', 'exists:users,id'],
            'thumbnail' => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png', 'max:2048'],
        ];
    }

    public static function fromModel(Course $model): self {
        // Format duration
        $durationFormatted = null;
        if ($model->duration) {
            $minutes = (int) $model->duration;
            $hours = floor($minutes / 60);
            $mins = $minutes % 60;
            if ($hours > 0 && $mins > 0) {
                $durationFormatted = "{$hours} jam {$mins} menit";
            } elseif ($hours > 0) {
                $durationFormatted = "{$hours} jam";
            } else {
                $durationFormatted = "{$mins} menit";
            }
        }

        // Format dates
        $createdAtFormatted = null;
        if ($model->created_at) {
            $createdAtFormatted = $model->created_at->locale('id')->translatedFormat('j F Y');
        }

        $updatedAtFormatted = null;
        if ($model->updated_at) {
            $updatedAtFormatted = $model->updated_at->locale('id')->translatedFormat('j F Y');
        }

        $thumbnail = $model->thumbnail;
        $thumbnailUrl = null;
        if ($thumbnail) {
            $thumbnailUrl = Str::startsWith($thumbnail, 'http') ? $thumbnail : asset('storage/' . $thumbnail);
        }

        $courseInstructorsRelation = $model->relationLoaded('course_instructors')
            ? $model->course_instructors
            : $model->course_instructors()->get();

        $instructorIds = $courseInstructorsRelation
            ->pluck('id')
            ->map(static fn ($id) => (int) $id)
            ->all();

        return new self(
            id: $model->getKey(),
            instructor_ids: $instructorIds,
            // module_ids: $model->relationLoaded('Modules')
            //     ? $model->Modules->pluck('id')->map(static fn ($id) => (int) $id)->all()
            //     : $model->Modules()->pluck('Modules.id')->map(static fn ($id) => (int) $id)->all(),
            // quiz_ids: $model->relationLoaded('Quizzes')
            //     ? $model->Quizzes->pluck('id')->map(static fn ($id) => (int) $id)->all()
            //     : $model->Quizzes()->pluck('Quizzes.id')->map(static fn ($id) => (int) $id)->all(),
            // enrollment_ids: $model->relationLoaded('Enrollments')
            //     ? $model->Enrollments->pluck('id')->map(static fn ($id) => (int) $id)->all()
            //     : $model->Enrollments()->pluck('Enrollments.id')->map(static fn ($id) => (int) $id)->all(),
            // certificate_ids: $model->relationLoaded('Certificates')
            //     ? $model->Certificates->pluck('id')->map(static fn ($id) => (int) $id)->all()
            //     : $model->Certificates()->pluck('Certificates.id')->map(static fn ($id) => (int) $id)->all(),
            title: $model->title,
            slug: $model->slug,
            description: $model->description,
            certification_enabled: $model->certification_enabled,
            thumbnail: $model->thumbnail,
            thumbnail_url: $thumbnailUrl,
            level: $model->level,
            duration: $model->duration,
            duration_formatted: $durationFormatted,
            created_at: $model->created_at?->toIso8601String(),
            created_at_formatted: $createdAtFormatted,
            updated_at: $model->updated_at?->toIso8601String(),
            updated_at_formatted: $updatedAtFormatted,
            course_instructors: $model->relationLoaded('course_instructors') ? new DataCollection(UserData::class, $courseInstructorsRelation) : null,
            // Modules: $model->relationLoaded('Modules')
            //     ? new DataCollection(ModuleData::class, $model->Modules)
            //     : new DataCollection(ModuleData::class, []),
            // Quizzes: $model->relationLoaded('Quizzes')
            //     ? new DataCollection(QuizData::class, $model->Quizzes)
            //     : new DataCollection(QuizData::class, []),
            // Enrollments: $model->relationLoaded('Enrollments')
            //     ? new DataCollection(EnrollmentData::class, $model->Enrollments)
            //     : new DataCollection(EnrollmentData::class, []),
            // Certificates: $model->relationLoaded('Certificates')
            //     ? new DataCollection(CertificateData::class, $model->Certificates)
            //     : new DataCollection(CertificateData::class, []),
        );
    }
}
