<?php

namespace App\Imports\Quiz;

use App\Models\Quiz;
use DB;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;

class QuizzesImport implements ToCollection {
    public function __construct(private Quiz $quiz) {}

    /**
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function collection(Collection $rows) {
        $headers = $rows[0];
        if (($headers->search('Soal / Pertanyaan*') !== 0 && empty($headers->search('Soal / Pertanyaan*'))) ||
            empty($headers->search('Opsi 1*')) ||
            empty($headers->search('Opsi 2*')) ||
            empty($headers->search('Opsi 3*'))) {
            throw new \Exception('Format Excel tidak valid, pastikan kolom "Soal / Pertanyaan*", "Opsi 1*", "Opsi 2*", dan "Opsi 3*" ada', 400);
        }
        DB::beginTransaction();
        try {
            $emptyCount = 0;
            $rows->skip(1)->take($rows->count() - 1)->each(function ($row) use ($headers, &$emptyCount) {
                if (!empty($row[$headers->search('Soal \/ Pertanyaan*')]) ||
                    !empty($row[$headers->search('Opsi 1*')])) {
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
                $quizQuestion = $this->quiz->quiz_questions()->firstOrCreate([
                    'question' => $question,
                ]);
                $option1 = $row[$headers->search('Opsi 1*')];
                $quizQuestion->quiz_question_options()->firstOrCreate([
                    'option_text' => $option1,
                    'is_correct' => true,
                ]);
                $quizQuestion->quiz_question_options()->createMany(
                    collect($row)->slice(2)->filter(fn ($v) => !empty($v))->map(fn ($v) => ['option_text' => $v])->toArray()
                );
            });
            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }

        return $this->quiz;
    }
}
