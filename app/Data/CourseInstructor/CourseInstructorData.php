<?php

namespace App\Data\CourseInstructor;

use App\Data\Course\CourseData;
use App\Data\User\UserData;
use App\Models\CourseInstructor;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class CourseInstructorData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.User.UserData | null')]
        public ?UserData $instructor,
        #[TypeScriptType('App.Data.Course.CourseData | null')]
        public ?CourseData $course,
    ) {}

    public static function fromModel(CourseInstructor $model): self {
        return new self(
            id: $model->getKey(),
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            instructor: $model->relationLoaded('instructor') && $model->instructor
                ? UserData::fromModel($model->instructor)
                : null,
            course: $model->relationLoaded('course') && $model->course
                ? CourseData::fromModel($model->course)
                : null,
        );
    }
}
