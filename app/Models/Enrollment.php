<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model {
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'progress',
        'completed_at',
        'user_id',
        'course_id',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'progress' => 0,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array {
        return [
            'progress' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo {
        return $this->belongsTo(Course::class);
    }
}
