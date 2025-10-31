<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VideoScene extends Model
{
    /** @use HasFactory<\Database\Factories\VideoSceneFactory> */
    use HasFactory;

    protected $fillable = [
        'module_content_id',
        'visual',
        'voice_over',
        'time_chapter',
        'interaction_trigger_time',
        'interaction_type',
    ];

    public function module_content(): BelongsTo
    {
        return $this->belongsTo(ModuleContent::class);
    }

    public function scene_interactions(): HasMany
    {
        return $this->hasMany(SceneInteraction::class);
    }
}
