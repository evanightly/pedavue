<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class QuizResult extends Model {
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'score',
        'earned_points',
        'total_points',
        'attempt',
        'started_at',
        'finished_at',
        'user_id',
        'quiz_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array {
        return [
            'score' => 'integer',
            'earned_points' => 'integer',
            'total_points' => 'integer',
            'attempt' => 'integer',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    public function quiz(): BelongsTo {
        return $this->belongsTo(Quiz::class);
    }

    public function module_stage_progress(): HasOne {
        return $this->hasOne(ModuleStageProgress::class);
    }
}
