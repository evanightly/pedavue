<?php

namespace App\Exports\QuizQuestion;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Table;
use PhpOffice\PhpSpreadsheet\Worksheet\Table\TableStyle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class QuizQuestionTemplateExport implements FromArray, ShouldAutoSize, WithEvents, WithHeadings, WithStyles {
    use Exportable;

    public function headings(): array {
        return [
            'Soal / Pertanyaan*',
            'Opsi 1 - Benar*',
            'Opsi 2*',
            'Opsi 3*',
            'Opsi 4',
        ];
    }

    public function styles(Worksheet $sheet) {
        $sheet->getStyle('A1:E1')->applyFromArray([
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
                $highestRow = $sheet->getHighestRow();

                $table = new Table('A1:E' . $highestRow, 'Quiz');
                $tableStyle = new TableStyle(TableStyle::TABLE_STYLE_LIGHT15);
                $tableStyle->setShowRowStripes(true);
                $table->setStyle($tableStyle);
                $sheet->addTable($table);
                $comment = $event->sheet->getDelegate()->getComment('E1');
                $comment->getText()->createTextRun("Opsi 1-3 wajib diisi, tambahkan kolom di kanan jika ingin menambahkan opsi lain.\n");
                $comment->setWidth('200pt');
                $comment->setHeight('150pt');
            },
        ];
    }

    public function array(): array {
        return [
            ['Apakah ini pertanyaan pertama?', 'Ya, ini pertanyaan pertama', 'Tidak, ini pertanyaan kedua', 'Tidak, ini pertanyaan ketiga', 'Tidak, ini pertanyaan keempat'],
            ['Apakah ada tiga pertanyaan?', 'Tidak, hanya ada dua pertanyaan saat ini', 'Mungkin', 'Ya, ini pertanyaan ketiga'],
        ];
    }
}