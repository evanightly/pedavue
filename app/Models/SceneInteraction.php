<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SceneInteraction extends Model
{
    use HasFactory;

    protected $fillable = [
        'video_scene_id',
        'interactable_type',
        'interactable_id',
        'payload',
        'position',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function video_scene(): BelongsTo
    {
        return $this->belongsTo(VideoScene::class);
    }

    public function interactable(): MorphTo
    {
        return $this->morphTo();
    }
}
