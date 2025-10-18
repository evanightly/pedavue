<?php

namespace App\Models;

use App\Observers\CourseObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'certificate_template', // if null, use system default template like udemy does
        'certificate_example',
        'certificate_name_position_x',
        'certificate_name_position_y',
        'certificate_name_max_length',
        'certificate_name_box_width',
        'certificate_name_box_height',
        'certificate_name_font_family',
        'certificate_name_font_weight',
        'certificate_name_text_align',
        'certificate_name_text_color',
        'certificate_name_letter_spacing',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array {
        return [
            'certification_enabled' => 'boolean',
            'certificate_name_position_x' => 'integer',
            'certificate_name_position_y' => 'integer',
            'certificate_name_max_length' => 'integer',
            'certificate_name_box_width' => 'integer',
            'certificate_name_box_height' => 'integer',
            'certificate_name_letter_spacing' => 'integer',
        ];
    }

    public function course_instructors(): BelongsToMany {
        return $this->belongsToMany(User::class, 'course_instructors', 'course_id', 'instructor_id')
            ->withTimestamps();
    }

    // public function course_instructors(): HasMany {
    //     return $this->hasMany(CourseInstructor::class);
    // }

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

    public function enrollments(): HasMany {
        return $this->hasMany(Enrollment::class);
    }

    public function students(): BelongsToMany {
        return $this->belongsToMany(User::class, 'enrollments', 'course_id', 'user_id')
            ->withPivot(['progress', 'completed_at'])
            ->withTimestamps();
    }

    // public function Certificates(): HasMany
    // {
    //     return $this->hasMany(Certificate::class);
    // }
}
