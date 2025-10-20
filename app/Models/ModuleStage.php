<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModuleStage extends Model {
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'module_able',
        'order',
        'module_id',
        'module_content_id',
        'module_quiz_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array {
        return [
            'order' => 'integer',
        ];
    }

    public function module(): BelongsTo {
        return $this->belongsTo(Module::class);
    }

    public function module_content(): BelongsTo {
        return $this->belongsTo(ModuleContent::class);
    }

    public function module_quiz(): BelongsTo {
        return $this->belongsTo(Quiz::class, 'module_quiz_id');
    }

    public function module_stage_progresses(): HasMany {
        return $this->hasMany(ModuleStageProgress::class);
    }
}
