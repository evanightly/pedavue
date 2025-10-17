<?php

namespace Database\Seeders;

use App\Models\QuizQuestion;
use App\Models\QuizQuestionOption;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class QuizQuestionOptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        QuizQuestion::all()->each(function ($quizQuestion) {
            $quizQuestionOptions = QuizQuestionOption::factory(rand(3, 4))->make(['quiz_question_id' => $quizQuestion->id]);
            $quizQuestionOptions->each(function ($quizQuestionOption, $index) {
                $quizQuestionOption->is_correct = $index === 0;
            });
            $quizQuestionOptions->each(fn($quizQuestionOption) => $quizQuestionOption->save());
        });
    }
}
