<?php

namespace App\Models;

use App\Observers\CourseObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy(CourseObserver::class)]
class Course extends Model {
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'certification_enabled',
        'thumbnail',
        'level',
        'duration',
        'instructor_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array {
        return [
            'certification_enabled' => 'boolean',
        ];
    }

    public function instructor(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    /**
     * Use the slug column for route model binding instead of the id.
     */
    public function getRouteKeyName(): string {
        return 'slug';
    }

    // public function Modules(): HasMany
    // {
    //     return $this->hasMany(Module::class);
    // }

    // public function Quizzes(): HasMany
    // {
    //     return $this->hasMany(Quiz::class);
    // }

    // public function Enrollments(): HasMany
    // {
    //     return $this->hasMany(Enrollment::class);
    // }

    // public function Certificates(): HasMany
    // {
    //     return $this->hasMany(Certificate::class);
    // }
}
