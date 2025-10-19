<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    /** @use HasFactory<\Database\Factories\QuizFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'duration', // act as a time limit in minutes
        'is_question_shuffled',
        'type',
    ];

    public function quiz_questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class);
    }
}
