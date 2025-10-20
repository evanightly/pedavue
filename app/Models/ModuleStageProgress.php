<?php

namespace App\Models;

use App\Support\Enums\ModuleStageProgressStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleStageProgress extends Model {
    use HasFactory;

    protected $table = 'module_stage_progress';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'enrollment_id',
        'module_stage_id',
        'quiz_result_id',
        'status',
        'started_at',
        'completed_at',
        'state',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => ModuleStageProgressStatus::Pending->value,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'state' => 'array',
        ];
    }

    public function enrollment(): BelongsTo {
        return $this->belongsTo(Enrollment::class);
    }

    public function module_stage(): BelongsTo {
        return $this->belongsTo(ModuleStage::class);
    }

    public function quiz_result(): BelongsTo {
        return $this->belongsTo(QuizResult::class);
    }

    public function statusEnum(): ModuleStageProgressStatus {
        return ModuleStageProgressStatus::from($this->status);
    }
}
