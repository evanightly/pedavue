<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property-read null|'content'|'quiz' $module_able
 */
class ModuleStage extends Model {
    use HasFactory;

    public const MODULEABLE_MAP = [
        'content' => ModuleContent::class,
        'quiz' => Quiz::class,
    ];

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'order',
        'module_id',
        'module_able_type',
        'module_able_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array {
        return [
            'order' => 'integer',
            'module_able_id' => 'integer',
        ];
    }

    public function module(): BelongsTo {
        return $this->belongsTo(Module::class);
    }

    public function moduleAble(): MorphTo {
        return $this->morphTo();
    }

    public function getModuleAbleAttribute(): ?string {
        return self::moduleAbleKeyForType($this->module_able_type);
    }

    public function module_stage_progresses(): HasMany {
        return $this->hasMany(ModuleStageProgress::class);
    }

    public function module_content(): HasOne {
        return $this->hasOne(ModuleContent::class, 'id', 'module_able_id');
    }

    public function module_quiz(): HasOne {
        return $this->hasOne(Quiz::class, 'id', 'module_able_id');
    }

    protected function moduleContent(): Attribute {
        return Attribute::get(function (): ?ModuleContent {
            $relation = $this->getRelationValue('moduleAble');

            return $relation instanceof ModuleContent ? $relation : null;
        });
    }

    protected function moduleQuiz(): Attribute {
        return Attribute::get(function (): ?Quiz {
            $relation = $this->getRelationValue('moduleAble');

            return $relation instanceof Quiz ? $relation : null;
        });
    }

    public function moduleType(): ?string {
        return $this->module_able;
    }

    public function matchesModuleType(?string $type): bool {
        return $this->moduleType() === $type;
    }

    public function isQuiz(): bool {
        return $this->matchesModuleType('quiz');
    }

    public function isContent(): bool {
        return $this->matchesModuleType('content');
    }

    public static function moduleAbleTypeForKey(?string $key): ?string {
        if ($key === null) {
            return null;
        }

        return self::MODULEABLE_MAP[$key] ?? null;
    }

    public static function moduleAbleKeyForType(?string $type): ?string {
        if ($type === null) {
            return null;
        }

        $flipMap = array_flip(self::MODULEABLE_MAP);

        return $flipMap[$type] ?? null;
    }
}
