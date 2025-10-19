<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function stages(): HasMany {
        return $this->module_stages();
    }
}
