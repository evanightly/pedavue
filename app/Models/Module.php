<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Module extends Model {
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'thumbnail',
        'duration',
        'order',
        'course_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array {
        return [
            'duration' => 'integer',
            'order' => 'integer',
        ];
    }

    public function course(): BelongsTo {
        return $this->belongsTo(Course::class);
    }

    public function module_stages(): HasMany {
        return $this
            ->hasMany(ModuleStage::class)
            ->orderBy('order');
    }

    public function moduleStages(): HasMany { // Route binding compatibility for workspace
        return $this->module_stages();
    }

    public function stages(): HasMany { // Route binding compatibility for quiz
        return $this->module_stages();
    }

    public function module_contents(): HasManyThrough {
        return $this->hasManyThrough(
            ModuleContent::class,
            ModuleStage::class,
            'module_id',
            'module_stage_id',
            'id',
            'id'
        );
    }

    public function module_quizzes(): BelongsToMany {
        return $this
            ->belongsToMany(
                Quiz::class,
                'module_stages',
                'module_id',
                'module_able_id'
            )
            ->wherePivot(
                'module_able_type',
                ModuleStage::moduleAbleTypeForKey('quiz')
            );
    }
}
