<?php

namespace App\Data\EnrollmentRequest;

use App\Data\Course\CourseData;
use App\Data\User\UserData;
use App\Models\EnrollmentRequest;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class EnrollmentRequestData extends Data
{
    public function __construct(
        public int|Optional $id,
        public ?string $message,
        public ?string $status,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.User.UserData | null')]
        public ?UserData $user,
        #[TypeScriptType('App.Data.Course.CourseData | null')]
        public ?CourseData $course,
    ) {}


    public static function fromModel(EnrollmentRequest $model): self
    {
        return new self(
            id: $model->getKey(),
            message: $model->message,
            status: $model->status,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            user: $model->relationLoaded('user') && $model->user
                ? UserData::fromModel($model->user)
                : null,
            course: $model->relationLoaded('course') && $model->course
                ? CourseData::fromModel($model->course)
                : null,
        );
    }
}
