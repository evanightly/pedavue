<?php

namespace App\Imports\QuizQuestion;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use DB;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;

class QuizQuestionImport implements ToCollection {
    public function __construct(private Quiz $quiz, private ?bool $is_answer_shuffled = false) {}
    /**
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function collection(Collection $rows) {
        $headers = $rows[0];
        if (($headers->search('Soal / Pertanyaan*') !== 0 && empty($headers->search('Soal / Pertanyaan*'))) ||
            empty($headers->search('Opsi 1 - Benar*')) ||
            empty($headers->search('Opsi 2*')) ||
            empty($headers->search('Opsi 3*'))) {
            throw new \Exception('Format Excel tidak valid, pastikan kolom "Soal / Pertanyaan*", "Opsi 1 - Benar*", "Opsi 2*", dan "Opsi 3*" ada', 400);
        }
        DB::beginTransaction();
        try {
            $emptyCount = 0;
            $questionAdded = 0;
            $rows->skip(1)->take($rows->count() - 1)->each(function ($row) use ($headers, &$emptyCount, &$questionAdded) {
                if (!empty($row[$headers->search('Soal \/ Pertanyaan*')]) ||
                    !empty($row[$headers->search('Opsi 1 - Benar*')])) {
                    $emptyCount = 0;
                } else {
                    $emptyCount++;
                    if ($emptyCount > 5) {
                        DB::commit();
                        return false;
                    }
                    return;
                }
                $question = $row[$headers->search('Soal \/ Pertanyaan*')];
                $quizQuestion = $this->quiz->quiz_questions()->updateOrCreate([
                    'question' => $question,
                ],[
                    'order' => $questionAdded + 1
                ]);
                $questionAdded++;

                $correct_options = $row[$headers->search('Opsi 1 - Benar*')];
                $quizQuestion->quiz_question_options()->firstOrCreate([
                    'option_text' => $correct_options,
                    'is_correct' => true,
                ]);

                $otherOptions = collect($row)->slice(2)->filter(fn($v) => !empty($v));
                $otherOptions->each(function ($option, $index) use ($quizQuestion) {
                    $quizQuestion->quiz_question_options()->firstOrCreate([
                        'option_text' => $option,
                        'is_correct' => false,
                    ]);
                });

                $quizQuestionOptions = $quizQuestion->quiz_question_options();
                $quizQuestionOptions = $this->is_answer_shuffled ? $quizQuestionOptions->inRandomOrder() : $quizQuestionOptions;
                $option_order = 1;
                $quizQuestionOptions->get()->each(function ($options) use (&$option_order) {
                    $options->order = $option_order++;
                    $options->save();
                });
            });
            $questions = $this->quiz->quiz_questions();
            $questions = $this->quiz->is_question_shuffled ? $questions->inRandomOrder() : $questions;
            $question_order = $this->quiz->is_question_shuffled ? 1 : $questionAdded + 1;
            $questions->orderBy('order')->skip($this->quiz->is_question_shuffled ? 0 : $questionAdded)->each(function ($question) use (&$question_order) {
                $question->order = $question_order++;
                $question->save();
            });
            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }

        return $this->quiz;
    }
}