<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    /** @use HasFactory<\Database\Factories\QuizFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'duration',
    ];

    public function quiz_questions()
    {
        return $this->hasMany(QuizQuestion::class);
    }
}
