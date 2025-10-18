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
class EnrollmentRequestData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $message,
        public ?string $status,
        #[TypeScriptType('number|null')]
        public int|Optional $course_id,
        #[TypeScriptType('number|null')]
        public int|Optional $user_id,
        public ?string $course_title,
        public ?string $user_name,
        public ?string $created_at,
        public ?string $updated_at,
        public ?string $created_at_formatted,
        public ?string $updated_at_formatted,
        public ?string $enrollment_created_at_formatted,
        public ?string $user_created_at_formatted,
        #[TypeScriptType('App.Data.User.UserData | null')]
        public ?UserData $user,
        #[TypeScriptType('App.Data.Course.CourseData | null')]
        public ?CourseData $course,
    ) {}

    public static function fromModel(EnrollmentRequest $model): self {
        $createdAt = $model->created_at;
        $updatedAt = $model->updated_at;

        $createdAtFormatted = $createdAt
            ? $createdAt->locale('id')->translatedFormat('j F Y H:i')
            : null;

        $updatedAtFormatted = $updatedAt
            ? $updatedAt->locale('id')->translatedFormat('j F Y H:i')
            : null;

        $userCreatedAtFormatted = null;
        if ($model->relationLoaded('user') && $model->user && $model->user->created_at) {
            $userCreatedAtFormatted = $model->user->created_at->locale('id')->translatedFormat('j F Y H:i');
        }

        return new self(
            id: $model->getKey(),
            message: $model->message,
            status: $model->status->value,
            course_id: $model->course_id,
            user_id: $model->user_id,
            course_title: $model->relationLoaded('course') && $model->course ? $model->course->title : null,
            user_name: $model->relationLoaded('user') && $model->user ? $model->user->name : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            created_at_formatted: $createdAtFormatted,
            updated_at_formatted: $updatedAtFormatted,
            enrollment_created_at_formatted: $createdAtFormatted,
            user_created_at_formatted: $userCreatedAtFormatted,
            user: $model->relationLoaded('user') && $model->user
                ? UserData::fromModel($model->user)
                : null,
            course: $model->relationLoaded('course') && $model->course
                ? CourseData::fromModel($model->course)
                : null,
        );
    }
}
