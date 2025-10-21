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
     * @var array<int, array{question:?string, options: array<int, array{option_text:?string}>}>
     */
    private array $dataset;

    private int $maxOptions;
    private int $columnCount;

    /**
     * @param  array<int, array{question:?string, options: array<int, array{option_text:?string}>}>  $questions
     */
    public function __construct(array $questions = []) {
        $this->dataset = $questions === [] ? self::defaultQuestions() : $questions;
        $this->maxOptions = max(3, $this->resolveMaxOptions($this->dataset));
        $this->columnCount = 2 + ($this->maxOptions * 2);
    }

    public function headings(): array {
        $headings = [
            'Soal / Pertanyaan*',
            'Gambar Pertanyaan (opsional)',
        ];

        for ($index = 1; $index <= $this->maxOptions; $index++) {
            $suffix = $index <= 3 ? '*' : '';
            $label = 'Opsi ' . $index . ($index === 1 ? ' - Benar' : '') . $suffix;

            $headings[] = $label;
            $headings[] = 'Gambar Opsi ' . $index . ' (opsional)';
        }

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
                $comment->getText()->createTextRun("Opsi 1 otomatis dianggap jawaban benar. Tambahkan pasangan kolom teks dan gambar di kanan bila perlu lebih banyak opsi.\n");
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

            for ($index = 0; $index < $this->maxOptions; $index++) {
                $option = $question['options'][$index] ?? null;
                $row[] = $option['option_text'] ?? null;
                $row[] = null;
            }

            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * @param  array<int, array{question:?string, options: array<int, array{option_text:?string}>}>  $questions
     */
    private function resolveMaxOptions(array $questions): int {
        $collection = Collection::make($questions);

        return (int) $collection
            ->pluck('options')
            ->map(fn ($options) => is_array($options) ? count($options) : 0)
            ->max() ?? 0;
    }

    /**
     * @return array<int, array{question:?string, options: array<int, array{option_text:?string}>}>
     */
    private static function defaultQuestions(): array {
        return [
            [
                'question' => 'Contoh: Apa tujuan utama sesi pembelajaran ini?',
                'options' => [
                    ['option_text' => 'Memahami konsep dasar yang dibahas pada modul ini'],
                    ['option_text' => 'Menebak topik secara acak'],
                    ['option_text' => 'Menghafal jawaban tanpa memahami materi'],
                    ['option_text' => 'Tidak ada tujuan yang jelas'],
                ],
            ],
            [
                'question' => 'Contoh: Materi apa yang ditinjau pada evaluasi Bab 1?',
                'options' => [
                    ['option_text' => 'Seluruh pokok bahasan yang sudah dipelajari pada modul 1'],
                    ['option_text' => 'Materi dari modul lain yang belum dipelajari'],
                    ['option_text' => 'Topik yang tidak berhubungan dengan kursus'],
                ],
            ],
        ];
    }
}
