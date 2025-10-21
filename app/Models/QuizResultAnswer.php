<?php

namespace App\Models;

use App\Models\Answer;
use App\Models\Question;
use App\Models\QuizResult;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizResultAnswer extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'user_answer_text',
        'started_at',
        'finished_at',
        'quiz_result_id',
        'question_id',
        'answer_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function quiz_result(): BelongsTo
    {
        return $this->belongsTo(QuizResult::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function answer(): BelongsTo
    {
        return $this->belongsTo(Answer::class);
    }
}
