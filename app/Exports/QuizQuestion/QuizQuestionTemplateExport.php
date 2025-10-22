<?php

namespace App\Exports\QuizQuestion;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Worksheet\Table;
use PhpOffice\PhpSpreadsheet\Worksheet\Table\TableStyle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class QuizQuestionTemplateExport implements FromArray, ShouldAutoSize, WithEvents, WithHeadings, WithStyles {
    use Exportable;

    /**
     * @var array<int, array{question:?string, options: array<int, array{option_text:?string,is_correct?:bool}>}>
     */
    private array $dataset;

    private int $maxOptions;
    private int $columnCount;

    /**
     * @param  array<int, array{question:?string, options: array<int, array{option_text:?string,is_correct?:bool}>}>  $questions
     */
    public function __construct(array $questions = []) {
        $this->dataset = $questions === [] ? self::defaultQuestions() : $questions;
        $this->maxOptions = max(3, $this->resolveMaxOptions($this->dataset));
        $this->columnCount = 2 + ($this->maxOptions * 2) + 1;
    }

    public function headings(): array {
        $headings = [
            'Soal / Pertanyaan*',
            'Gambar Pertanyaan (opsional)',
        ];

        for ($index = 1; $index <= $this->maxOptions; $index++) {
            $suffix = $index <= 3 ? '*' : '';
            $optionLabel = $this->optionLabel($index - 1);
            $label = 'Jawaban ' . $optionLabel . ($index === 1 ? ' - Benar' : '') . $suffix;

            $headings[] = $label;
            $headings[] = 'Gambar Jawaban ' . $optionLabel . ' (opsional)';
        }

        $headings[] = 'Jawaban Benar*';

        return $headings;
    }

    public function styles(Worksheet $sheet): void {
        $lastColumn = Coordinate::stringFromColumnIndex($this->columnCount);

        $sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4F81BD'],
            ],
        ]);
    }

    public function registerEvents(): array {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = max(2, $sheet->getHighestRow());
                $lastColumn = Coordinate::stringFromColumnIndex($this->columnCount);

                $table = new Table('A1:' . $lastColumn . $highestRow, 'Quiz');
                $tableStyle = new TableStyle(TableStyle::TABLE_STYLE_LIGHT15);
                $tableStyle->setShowRowStripes(true);
                $table->setStyle($tableStyle);
                $sheet->addTable($table);

                $comment = $sheet->getComment($lastColumn . '1');
                $comment->getText()->createTextRun("Isi kolom Jawaban Benar dengan huruf (A, B, C, ...) atau angka (1, 2, 3, ...) dari opsi yang benar. Pisahkan lebih dari satu jawaban dengan tanda /.\n");
                $comment->setWidth('220pt');
                $comment->setHeight('150pt');
            },
        ];
    }

    public function array(): array {
        $rows = [];

        foreach ($this->dataset as $question) {
            $row = [
                $question['question'] ?? null,
                null,
            ];

            $correctLabels = [];
            for ($index = 0; $index < $this->maxOptions; $index++) {
                $option = $question['options'][$index] ?? null;
                $row[] = is_array($option) ? ($option['option_text'] ?? null) : null;
                $row[] = null;

                if (is_array($option) && (($option['is_correct'] ?? false) === true)) {
                    $correctLabels[] = $this->optionLabel($index);
                }
            }

            if ($correctLabels === []) {
                $correctLabels[] = $this->optionLabel(0);
            }

            $row[] = implode('/', $correctLabels);
            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * @param  array<int, array{question:?string, options: array<int, array{option_text:?string,is_correct?:bool}>}>  $questions
     */
    private function resolveMaxOptions(array $questions): int {
        $collection = Collection::make($questions);

        return (int) $collection
            ->pluck('options')
            ->map(fn ($options) => is_array($options) ? count($options) : 0)
            ->max() ?? 0;
    }

    private function optionLabel(int $zeroBasedIndex): string {
        $index = max(0, $zeroBasedIndex);
        $label = '';

        do {
            $label = chr(ord('A') + ($index % 26)) . $label;
            $index = intdiv($index, 26) - 1;
        } while ($index >= 0);

        return $label;
    }

    /**
     * @return array<int, array{question:?string, options: array<int, array{option_text:?string,is_correct?:bool}>}>
     */
    private static function defaultQuestions(): array {
        return [
            [
                'question' => 'Contoh: Apa tujuan utama sesi pembelajaran ini?',
                'options' => [
                    ['option_text' => 'Memahami konsep dasar yang dibahas pada modul ini', 'is_correct' => true],
                    ['option_text' => 'Menebak topik secara acak', 'is_correct' => false],
                    ['option_text' => 'Menghafal jawaban tanpa memahami materi', 'is_correct' => false],
                    ['option_text' => 'Tidak ada tujuan yang jelas', 'is_correct' => false],
                ],
            ],
            [
                'question' => 'Contoh: Materi apa yang ditinjau pada evaluasi Bab 1?',
                'options' => [
                    ['option_text' => 'Seluruh pokok bahasan yang sudah dipelajari pada modul 1', 'is_correct' => true],
                    ['option_text' => 'Materi dari modul lain yang belum dipelajari', 'is_correct' => false],
                    ['option_text' => 'Topik yang tidak berhubungan dengan kursus', 'is_correct' => false],
                ],
            ],
        ];
    }
}
