<?php

namespace App\Support\QuizImport;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\MemoryDrawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use RuntimeException;

class QuizImportService {
    private const QUESTION_HEADING = 'Soal / Pertanyaan*';

    private const QUESTION_IMAGE_HEADING = 'Gambar Pertanyaan (opsional)';

    private const CORRECT_ANSWER_HEADING = 'Jawaban Benar*';

    private const OPTION_HEADING_PATTERN = '/^Opsi\s*(\d+)/i';

    private const OPTION_IMAGE_HEADING_PATTERN = '/^Gambar\s+Opsi\s*(\d+)/i';

    private const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    private const ALLOWED_IMAGE_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
    ];

    public function parse(UploadedFile $file): QuizImportParseResult {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();

        $headings = $this->resolveHeadings($sheet);
        $correctAnswerColumnIndex = $this->resolveCorrectAnswerColumnIndex($headings);

        if ($correctAnswerColumnIndex === null) {
            throw new RuntimeException('Kolom Jawaban Benar tidak ditemukan pada template impor.');
        }

        $columnConfiguration = $this->buildColumnConfiguration($headings, $correctAnswerColumnIndex);

        $drawingMap = $this->prepareDrawingMap($sheet);
        $highestRow = $sheet->getHighestRow();

        $questions = [];
        $errors = [];
        $warnings = [];
        $consecutiveEmptyRows = 0;

        for ($row = 2; $row <= $highestRow; $row++) {
            $rowHasErrors = false;

            $questionText = $this->cellStringValue($sheet, $columnConfiguration['question'], $row);
            $questionImageKey = 'rows.' . $row . '.question_image';
            $questionImageCandidate = $this->retrieveImageFromColumns(
                $drawingMap,
                [$columnConfiguration['question_image'], $columnConfiguration['question']],
                $row,
            );
            $questionImage = null;

            if ($questionImageCandidate !== null) {
                $questionImage = $this->validateImage(
                    image: $questionImageCandidate,
                    contextLabel: 'pertanyaan',
                    row: $row,
                    errorKey: $questionImageKey,
                    errors: $errors,
                );

                if (array_key_exists($questionImageKey, $errors)) {
                    $rowHasErrors = true;
                }
            }

            $optionSlots = $this->extractOptionSlots(
                $sheet,
                $columnConfiguration['options'],
                $drawingMap,
                $row,
                $errors,
                $rowHasErrors,
            );

            $nonEmptyOptionCount = 0;
            foreach ($optionSlots as $slot) {
                if ($slot['has_content']) {
                    $nonEmptyOptionCount++;
                }
            }

            $isQuestionEmpty = ($questionText === null || $questionText === '') && $questionImage === null;

            if ($isQuestionEmpty && $nonEmptyOptionCount === 0) {
                $consecutiveEmptyRows++;
                if ($consecutiveEmptyRows >= 5) {
                    break;
                }

                continue;
            }

            $consecutiveEmptyRows = 0;

            if ($nonEmptyOptionCount < 2) {
                $this->recordRowError(
                    $errors,
                    'rows.' . $row . '.options',
                    'Setiap pertanyaan pada baris ' . $row . ' membutuhkan minimal dua opsi dengan teks atau gambar.',
                );
                $rowHasErrors = true;
            }

            if ($rowHasErrors) {
                continue;
            }

            $options = [];
            $slotToOptionIndex = [];

            foreach ($optionSlots as $slotIndex => $slot) {
                if (!$slot['has_content']) {
                    continue;
                }

                $slotToOptionIndex[$slotIndex] = count($options);
                $options[] = [
                    'option_text' => $slot['text'],
                    'is_correct' => false,
                    'image' => $slot['image'],
                ];
            }

            $correctAnswerKey = 'rows.' . $row . '.correct_answer';
            $correctAnswerValue = $this->cellStringValue($sheet, $correctAnswerColumnIndex, $row);
            $selectedSlots = $this->resolveCorrectAnswerSelection(
                $correctAnswerValue,
                count($optionSlots),
                $row,
                $correctAnswerKey,
                $errors,
            );

            if ($selectedSlots === null) {
                continue;
            }

            $invalidSelection = false;
            foreach ($selectedSlots as $slotIndex) {
                if (!isset($slotToOptionIndex[$slotIndex])) {
                    $this->recordRowError(
                        $errors,
                        $correctAnswerKey,
                        'Opsi ' . $this->optionSlotLabel($slotIndex) . ' pada baris ' . $row . ' tidak memiliki konten. Perbarui kolom Jawaban Benar Anda.',
                    );
                    $invalidSelection = true;
                    $rowHasErrors = true;

                    continue;
                }

                $options[$slotToOptionIndex[$slotIndex]]['is_correct'] = true;
            }

            if ($invalidSelection) {
                continue;
            }

            $hasCorrectOption = false;
            foreach ($options as $option) {
                if (($option['is_correct'] ?? false) === true) {
                    $hasCorrectOption = true;
                    break;
                }
            }

            if (!$hasCorrectOption && isset($options[0])) {
                $options[0]['is_correct'] = true;
            }

            $questions[] = [
                'question' => $questionText,
                'image' => $questionImage,
                'options' => $options,
            ];
        }

        if (empty($questions) && empty($errors)) {
            $errors['file'] = 'Berkas tidak berisi pertanyaan yang dapat diimpor.';
        }

        return new QuizImportParseResult($questions, $warnings, $errors);
    }

    private function recordRowError(array &$errors, string $key, string $message): void {
        $errors[$key] = $message;

        if (!isset($errors['file'])) {
            $errors['file'] = 'Berkas templat tidak dapat diproses karena ada data yang tidak valid. Perbaiki pesan kesalahan lalu unggah ulang.';
        }
    }

    /**
     * @param  array{data:string,mime_type:string,extension:string,original_name:string}|null  $image
     * @return array{data:string,mime_type:string,extension:string,original_name:string}|null
     */
    private function validateImage(?array $image, string $contextLabel, int $row, string $errorKey, array &$errors): ?array {
        if ($image === null) {
            return null;
        }

        $binary = base64_decode($image['data'] ?? '', true);
        if ($binary === false) {
            $this->recordRowError(
                $errors,
                $errorKey,
                'Gambar ' . $contextLabel . ' pada baris ' . $row . ' tidak dapat dibaca. Gunakan format JPG, PNG, GIF, BMP, atau WEBP.',
            );

            return null;
        }

        $size = strlen($binary);
        if ($size > self::MAX_IMAGE_SIZE_BYTES) {
            $this->recordRowError(
                $errors,
                $errorKey,
                'Gambar ' . $contextLabel . ' pada baris ' . $row . ' melebihi batas 5 MB. Perkecil ukuran file sebelum mengunggah.',
            );

            return null;
        }

        $mimeType = strtolower((string) ($image['mime_type'] ?? ''));
        if ($mimeType !== '' && !in_array($mimeType, self::ALLOWED_IMAGE_MIME_TYPES, true)) {
            $this->recordRowError(
                $errors,
                $errorKey,
                'Gambar ' . $contextLabel . ' pada baris ' . $row . ' menggunakan format ' . $mimeType . ' yang tidak didukung. Gunakan JPG, PNG, GIF, BMP, atau WEBP.',
            );

            return null;
        }

        return $image;
    }

    /**
     * @param  array{data:string,mime_type:string,extension:string,original_name:string}  $imageData
     */
    public function toUploadedFile(array $imageData, string $prefix): UploadedFile {
        $binary = base64_decode($imageData['data'], true);
        if ($binary === false) {
            throw new RuntimeException('Gagal memproses gambar dari template impor.');
        }

        $temporaryPath = tempnam(sys_get_temp_dir(), 'quiz-import-');
        if ($temporaryPath === false) {
            throw new RuntimeException('Gagal menyiapkan berkas sementara untuk gambar impor.');
        }

        file_put_contents($temporaryPath, $binary);

        $filename = $imageData['original_name'] ?: $prefix . '.' . $imageData['extension'];

        return new UploadedFile($temporaryPath, $filename, $imageData['mime_type'], null, true);
    }

    /**
     * @return array<int, string>
     */
    private function resolveHeadings(Worksheet $sheet): array {
        $highestColumnIndex = Coordinate::columnIndexFromString($sheet->getHighestColumn());
        $headings = [];

        for ($col = 1; $col <= $highestColumnIndex; $col++) {
            $headings[$col] = trim((string) $sheet->getCellByColumnAndRow($col, 1)->getValue());
        }

        return $headings;
    }

    /**
     * @param  array<int, string>  $headings
     * @return array{question:int,question_image:int|null,options:array<int, array{number:int,text:int,image:int|null}>}
     */
    private function buildColumnConfiguration(array $headings, int $correctAnswerColumnIndex): array {
        $questionColumnIndex = $this->findColumnIndex($headings, self::QUESTION_HEADING);
        if ($questionColumnIndex === null) {
            throw new RuntimeException('Kolom Soal / Pertanyaan* tidak ditemukan pada template impor.');
        }

        $questionImageColumnIndex = $this->findColumnIndex($headings, self::QUESTION_IMAGE_HEADING);
        $optionColumns = $this->buildOptionColumns($headings, $correctAnswerColumnIndex);

        if (count($optionColumns) < 2) {
            throw new RuntimeException('Template impor membutuhkan minimal dua kolom opsi sebelum kolom Jawaban Benar*.');
        }

        return [
            'question' => $questionColumnIndex,
            'question_image' => $questionImageColumnIndex,
            'options' => $optionColumns,
        ];
    }

    /**
     * @param  array<int, string>  $headings
     */
    private function findColumnIndex(array $headings, string $target): ?int {
        foreach ($headings as $index => $heading) {
            if (Str::lower($heading) === Str::lower($target)) {
                return $index;
            }
        }

        return null;
    }

    /**
     * @param  array<int, string>  $headings
     * @return array<int, array{number:int,text:int,image:int|null}>
     */
    private function buildOptionColumns(array $headings, int $correctAnswerColumnIndex): array {
        $options = [];

        foreach ($headings as $index => $heading) {
            if ($index >= $correctAnswerColumnIndex) {
                continue;
            }

            if (preg_match(self::OPTION_HEADING_PATTERN, $heading, $matches)) {
                $optionNumber = (int) $matches[1];
                if (!isset($options[$optionNumber])) {
                    $options[$optionNumber] = [
                        'number' => $optionNumber,
                        'text' => $index,
                        'image' => null,
                    ];
                } else {
                    $options[$optionNumber]['text'] = $index;
                }

                continue;
            }

            if (preg_match(self::OPTION_IMAGE_HEADING_PATTERN, $heading, $matches)) {
                $optionNumber = (int) $matches[1];
                if (!isset($options[$optionNumber])) {
                    $options[$optionNumber] = [
                        'number' => $optionNumber,
                        'text' => null,
                        'image' => $index,
                    ];
                } else {
                    $options[$optionNumber]['image'] = $index;
                }
            }
        }

        $validOptions = array_filter(
            $options,
            static fn (array $option): bool => isset($option['text']) && $option['text'] !== null,
        );

        usort(
            $validOptions,
            static fn (array $left, array $right): int => $left['text'] <=> $right['text'],
        );

        return array_values(
            array_map(
                static fn (array $option): array => [
                    'number' => $option['number'],
                    'text' => (int) $option['text'],
                    'image' => $option['image'] ?? null,
                ],
                $validOptions,
            ),
        );
    }

    private function resolveCorrectAnswerColumnIndex(array $headings): ?int {
        foreach ($headings as $index => $heading) {
            if (Str::lower($heading) === Str::lower(self::CORRECT_ANSWER_HEADING)) {
                return $index;
            }
        }

        return null;
    }

    /**
     * @return array<int, int>|null
     */
    private function resolveCorrectAnswerSelection(
        ?string $value,
        int $optionSlotCount,
        int $row,
        string $errorKey,
        array &$errors,
    ): ?array {
        if ($optionSlotCount === 0) {
            return [];
        }

        if ($value === null || trim($value) === '') {
            return [0];
        }

        $rawTokens = preg_split('/[\s,;\/|]+/', strtoupper($value));
        if ($rawTokens === false) {
            $rawTokens = [];
        }

        $normalizedIndexes = [];
        foreach ($rawTokens as $token) {
            $token = trim($token);
            if ($token === '') {
                continue;
            }

            if (ctype_digit($token)) {
                $index = (int) $token;
            } elseif (strlen($token) === 1 && ctype_alpha($token)) {
                $index = ord($token) - ord('A') + 1;
            } else {
                $this->recordRowError(
                    $errors,
                    $errorKey,
                    'Nilai "' . $token . '" pada kolom Jawaban Benar baris ' . $row . ' tidak valid. Gunakan huruf (A, B, C, ...) atau angka (1, 2, 3, ...).',
                );

                return null;
            }

            if ($index < 1 || $index > $optionSlotCount) {
                $this->recordRowError(
                    $errors,
                    $errorKey,
                    'Nilai "' . $token . '" pada kolom Jawaban Benar baris ' . $row . ' berada di luar rentang opsi yang tersedia.',
                );

                return null;
            }

            $normalizedIndexes[] = $index - 1;
        }

        if ($normalizedIndexes === []) {
            return [0];
        }

        return array_values(array_unique($normalizedIndexes));
    }

    /**
     * @param  array<int, array{number:int,text:int,image:int|null}>  $optionColumns
     * @param  array<string, array{data:string,mime_type:string,extension:string,original_name:string}>  $drawingMap
     * @return array<int, array{number:int,text:?string,image:?array{data:string,mime_type:string,extension:string,original_name:string},has_content:bool}>
     */
    private function extractOptionSlots(
        Worksheet $sheet,
        array $optionColumns,
        array $drawingMap,
        int $row,
        array &$errors,
        bool &$rowHasErrors,
    ): array {
        $slots = [];

        foreach ($optionColumns as $slotIndex => $column) {
            $optionText = $this->cellStringValue($sheet, $column['text'], $row);
            $optionImageKey = 'rows.' . $row . '.options.' . $slotIndex . '.image';

            $optionImageCandidate = $this->retrieveImageFromColumns(
                $drawingMap,
                [$column['image'], $column['text']],
                $row,
            );

            $optionImage = null;
            if ($optionImageCandidate !== null) {
                $optionImage = $this->validateImage(
                    image: $optionImageCandidate,
                    contextLabel: 'opsi ' . $column['number'],
                    row: $row,
                    errorKey: $optionImageKey,
                    errors: $errors,
                );

                if (array_key_exists($optionImageKey, $errors)) {
                    $rowHasErrors = true;
                }
            }

            $hasContent = ($optionText !== null && $optionText !== '') || $optionImage !== null;

            $slots[] = [
                'number' => $column['number'],
                'text' => $optionText,
                'image' => $optionImage,
                'has_content' => $hasContent,
            ];
        }

        return $slots;
    }

    /**
     * @param  array<string, array{data:string,mime_type:string,extension:string,original_name:string}>  $drawingMap
     * @param  array<int|null>  $columns
     * @return array{data:string,mime_type:string,extension:string,original_name:string}|null
     */
    private function retrieveImageFromColumns(array $drawingMap, array $columns, int $row): ?array {
        foreach ($columns as $column) {
            if ($column === null) {
                continue;
            }

            $image = $this->drawingForCell($drawingMap, $column, $row);
            if ($image !== null) {
                return $image;
            }
        }

        return null;
    }

    private function optionSlotLabel(int $slotIndex): string {
        $label = '';
        $index = $slotIndex;

        do {
            $label = chr(ord('A') + ($index % 26)) . $label;
            $index = intdiv($index, 26) - 1;
        } while ($index >= 0);

        return $label;
    }

    /**
     * @return array<string, array{data:string,mime_type:string,extension:string,original_name:string}>
     */
    private function prepareDrawingMap(Worksheet $sheet): array {
        $map = [];

        foreach ($sheet->getDrawingCollection() as $drawing) {
            if (!$drawing instanceof Drawing) {
                continue;
            }

            $coordinates = $drawing->getCoordinates();
            if (!$coordinates) {
                continue;
            }

            $imageData = $this->extractDrawingData($drawing);
            if ($imageData === null) {
                continue;
            }

            $map[$coordinates] = $imageData;
        }

        return $map;
    }

    /**
     * @return array{data:string,mime_type:string,extension:string,original_name:string}|null
     */
    private function extractDrawingData(Drawing $drawing): ?array {
        if ($drawing instanceof MemoryDrawing) {
            $resource = $drawing->getImageResource();
            if (!$resource) {
                return null;
            }

            ob_start();
            switch ($drawing->getRenderingFunction()) {
                case MemoryDrawing::RENDERING_JPEG:
                    imagejpeg($resource);
                    $extension = 'jpg';
                    $mimeType = 'image/jpeg';
                    break;
                case MemoryDrawing::RENDERING_GIF:
                    imagegif($resource);
                    $extension = 'gif';
                    $mimeType = 'image/gif';
                    break;
                case MemoryDrawing::RENDERING_PNG:
                default:
                    imagepng($resource);
                    $extension = 'png';
                    $mimeType = 'image/png';
                    break;
            }
            $contents = ob_get_contents() ?: '';
            ob_end_clean();
        } else {
            $path = $drawing->getPath();
            if (!$path || !file_exists($path)) {
                return null;
            }

            $contents = file_get_contents($path);
            if ($contents === false) {
                return null;
            }

            $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION)) ?: 'png';
            $mimeType = mime_content_type($path) ?: 'image/' . $extension;
        }

        $name = $drawing->getName();
        $originalName = $name && $name !== '' ? $name . '.' . $extension : 'gambar-' . Str::uuid() . '.' . $extension;

        return [
            'data' => base64_encode($contents),
            'mime_type' => $mimeType,
            'extension' => $extension,
            'original_name' => $originalName,
        ];
    }

    /**
     * @param  array<string, array{data:string,mime_type:string,extension:string,original_name:string}>  $drawingMap
     * @return array{data:string,mime_type:string,extension:string,original_name:string}|null
     */
    private function drawingForCell(array $drawingMap, int $column, int $row): ?array {
        $coordinate = Coordinate::stringFromColumnIndex($column) . $row;

        return $drawingMap[$coordinate] ?? null;
    }

    private function cellStringValue(Worksheet $sheet, int $column, int $row): ?string {
        $value = $sheet->getCellByColumnAndRow($column, $row)->getValue();

        if ($value === null) {
            return null;
        }

        $stringValue = trim((string) $value);

        return $stringValue === '' ? null : $stringValue;
    }
}
