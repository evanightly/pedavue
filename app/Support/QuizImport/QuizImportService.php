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
    private const REQUIRED_HEADINGS = [
        'Soal / Pertanyaan*',
        'Gambar Pertanyaan (opsional)',
        'Opsi 1*',
        'Gambar Opsi 1 (opsional)',
        'Opsi 2*',
        'Gambar Opsi 2 (opsional)',
        'Opsi 3*',
        'Gambar Opsi 3 (opsional)',
    ];

    private const CORRECT_ANSWER_HEADING = 'Jawaban Benar*';

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
        $this->assertHeadings($headings, $correctAnswerColumnIndex);

        $drawingMap = $this->prepareDrawingMap($sheet);
        $highestRow = $sheet->getHighestRow();

        $questions = [];
        $errors = [];
        $warnings = [];
        $consecutiveEmptyRows = 0;

        for ($row = 2; $row <= $highestRow; $row++) {
            $rowHasErrors = false;

            $questionText = $this->cellStringValue($sheet, 1, $row);
            $questionImageKey = 'rows.' . $row . '.question_image';
            $questionImage = $this->validateImage(
                image: $this->drawingForCell($drawingMap, 2, $row),
                contextLabel: 'pertanyaan',
                row: $row,
                errorKey: $questionImageKey,
                errors: $errors,
            );

            if (array_key_exists($questionImageKey, $errors)) {
                $rowHasErrors = true;
            }

            $options = [];
            for ($col = 3; $col < $correctAnswerColumnIndex; $col += 2) {
                $optionText = $this->cellStringValue($sheet, $col, $row);
                $optionColumnIndex = intdiv($col - 1, 2);
                $optionImageKey = 'rows.' . $row . '.options.' . $optionColumnIndex . '.image';
                $optionImage = $this->validateImage(
                    image: $this->drawingForCell($drawingMap, $col + 1, $row),
                    contextLabel: 'opsi ' . $optionColumnIndex,
                    row: $row,
                    errorKey: $optionImageKey,
                    errors: $errors,
                );

                if (array_key_exists($optionImageKey, $errors)) {
                    $rowHasErrors = true;
                }

                $isEmpty = ($optionText === null || $optionText === '') && $optionImage === null;
                if ($isEmpty) {
                    continue;
                }
                $options[] = [
                    'option_text' => $optionText,
                    'is_correct' => false,
                    'image' => $optionImage,
                ];
            }

            $isQuestionEmpty = ($questionText === null || $questionText === '') && $questionImage === null;

            if ($isQuestionEmpty && count($options) === 0) {
                $consecutiveEmptyRows++;
                if ($consecutiveEmptyRows >= 5) {
                    break;
                }

                continue;
            }

            $consecutiveEmptyRows = 0;

            $optionCount = count($options);
            if ($optionCount < 2) {
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

            $correctAnswerKey = 'rows.' . $row . '.correct_answer';
            $correctAnswerValue = $this->cellStringValue($sheet, $correctAnswerColumnIndex, $row);
            $selectedCorrectIndexes = $this->resolveCorrectAnswerSelection(
                $correctAnswerValue,
                $optionCount,
                $row,
                $correctAnswerKey,
                $errors,
            );

            if ($selectedCorrectIndexes === null) {
                continue;
            }

            foreach ($selectedCorrectIndexes as $selectedIndex) {
                if (!isset($options[$selectedIndex])) {
                    continue;
                }

                $options[$selectedIndex]['is_correct'] = true;
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
     */
    private function assertHeadings(array $headings, ?int $correctAnswerColumnIndex): void {
        foreach (self::REQUIRED_HEADINGS as $index => $expectedHeading) {
            $columnIndex = $index + 1;
            if (!isset($headings[$columnIndex]) || Str::lower($headings[$columnIndex]) !== Str::lower($expectedHeading)) {
                throw new RuntimeException('Format kolom tidak sesuai dengan template impor terbaru.');
            }
        }

        if ($correctAnswerColumnIndex === null) {
            throw new RuntimeException('Kolom Jawaban Benar tidak ditemukan pada template impor.');
        }
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
        int $optionCount,
        int $row,
        string $errorKey,
        array &$errors,
    ): ?array {
        if ($optionCount === 0) {
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

            if ($index < 1 || $index > $optionCount) {
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
