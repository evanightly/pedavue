<?php

namespace Database\Seeders;

use App\Models\QuizResponse;
use App\Models\QuizResponseAnswer;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class QuizResponseAnswerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (QuizResponse::all() as $quizResponse) {
            QuizResponseAnswer::factory($quizResponse->quiz->quiz_questions->count())->create(['quiz_response_id' => $quizResponse->id]);
        }
    }
}
