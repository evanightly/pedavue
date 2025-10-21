<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizResponse extends Model
{
    /** @use HasFactory<\Database\Factories\QuizResponseFactory> */
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'user_id',
        'attempt',
        'score',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quiz_response_answers(): HasMany
    {
        return $this->hasMany(QuizResponseAnswer::class);
    }
}
