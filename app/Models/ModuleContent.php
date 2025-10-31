<?php

namespace App\Models;

use App\Models\ModuleStage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModuleContent extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'file_path',
        'content_url',
        'duration',
        'content_type',
        'module_stage_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'duration' => 'integer',
        ];
    }

    public function module_stage(): BelongsTo
    {
        return $this->belongsTo(ModuleStage::class);
    }

    public function video_scenes(): HasMany
    {
        return $this->hasMany(VideoScene::class);
    }
}
