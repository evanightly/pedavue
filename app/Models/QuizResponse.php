<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
