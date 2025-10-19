<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizQuestionOption extends Model {
    /** @use HasFactory<\Database\Factories\QuizQuestionOptionFactory> */
    use HasFactory;

    protected $fillable = [
        'quiz_question_id',
        'option_image',
        'option_text',
        'is_correct',
        'order',
    ];

    public function quiz_question(): BelongsTo {
        return $this->belongsTo(QuizQuestion::class);
    }
}
