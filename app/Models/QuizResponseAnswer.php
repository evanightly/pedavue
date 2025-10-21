<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizResponseAnswer extends Model
{
    /** @use HasFactory<\Database\Factories\QuizResponseAnswerFactory> */
    use HasFactory;

    protected $fillable = [
        'quiz_response_id',
        'quiz_question_id',
        'quiz_question_option_id',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function quiz_response(): BelongsTo
    {
        return $this->belongsTo(QuizResponse::class);
    }

    public function quiz_question(): BelongsTo
    {
        return $this->belongsTo(QuizQuestion::class);
    }

    public function quiz_question_option(): BelongsTo
    {
        return $this->belongsTo(QuizQuestionOption::class);
    }
}
