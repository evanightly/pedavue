<?php

namespace App\Models;

use App\Models\Course;
use App\Models\User;
use App\Support\Enums\EnrollmentRequestEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EnrollmentRequest extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'message',
        'status',
        'user_id',
        'course_id',
    ];

    protected $casts = [
        'status' => EnrollmentRequestEnum::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function isPending(): bool {
        return $this->status === EnrollmentRequestEnum::Pending;
    }

    public function isApproved(): bool {
        return $this->status === EnrollmentRequestEnum::Approved;
    }

    public function isRejected(): bool {
        return $this->status === EnrollmentRequestEnum::Rejected;
    }

}
