<?php

use App\Support\QuizImport\QuizImportService;

it('marks oversize images as invalid during validation', function () {
    $service = new QuizImportService;

    $reflection = new \ReflectionClass($service);
    $method = $reflection->getMethod('validateImage');
    $method->setAccessible(true);

    $errors = [];
    $largeImage = [
        'data' => base64_encode(str_repeat('A', (5 * 1024 * 1024) + 10)),
        'mime_type' => 'image/jpeg',
        'extension' => 'jpg',
        'original_name' => 'gambar-besar.jpg',
    ];

    $result = $method->invokeArgs($service, [
        $largeImage,
        'pertanyaan',
        2,
        'rows.2.question_image',
        &$errors,
    ]);

    expect($result)->toBeNull();
    expect($errors)->toHaveKey('rows.2.question_image');
    expect($errors['rows.2.question_image'])->toContain('5 MB');
    expect($errors)->toHaveKey('file');
});

it('parses alphabetic correct answer selections', function () {
    $service = new QuizImportService;

    $method = new \ReflectionMethod($service, 'resolveCorrectAnswerSelection');
    $method->setAccessible(true);

    $errors = [];
    $result = $method->invokeArgs($service, [
        'A/C',
        4,
        5,
        'rows.5.correct_answer',
        &$errors,
    ]);

    expect($result)->toBe([0, 2]);
    expect($errors)->toBeEmpty();
});

it('parses numeric correct answer selections', function () {
    $service = new QuizImportService;

    $method = new \ReflectionMethod($service, 'resolveCorrectAnswerSelection');
    $method->setAccessible(true);

    $errors = [];
    $result = $method->invokeArgs($service, [
        '2/3',
        4,
        6,
        'rows.6.correct_answer',
        &$errors,
    ]);

    expect($result)->toBe([1, 2]);
    expect($errors)->toBeEmpty();
});

it('rejects out of range correct answer selections', function () {
    $service = new QuizImportService;

    $method = new \ReflectionMethod($service, 'resolveCorrectAnswerSelection');
    $method->setAccessible(true);

    $errors = [];
    $result = $method->invokeArgs($service, [
        '5',
        3,
        7,
        'rows.7.correct_answer',
        &$errors,
    ]);

    expect($result)->toBeNull();
    expect($errors)->toHaveKey('rows.7.correct_answer');
    expect($errors['file'])->toContain('tidak dapat diproses');
});

it('builds column configuration without optional image columns', function () {
    $service = new QuizImportService;

    $method = new \ReflectionMethod($service, 'buildColumnConfiguration');
    $method->setAccessible(true);

    $headings = [
        1 => 'Soal / Pertanyaan*',
        2 => 'Jawaban A*',
        3 => 'Jawaban B*',
        4 => 'Jawaban C*',
        5 => 'Jawaban Benar*',
    ];

    $configuration = $method->invokeArgs($service, [$headings, 5]);

    expect($configuration['question'])->toBe(1);
    expect($configuration['question_image'])->toBeNull();
    expect($configuration['options'])->toHaveCount(3);
    expect($configuration['options'][0])->toMatchArray([
        'number' => 1,
        'label' => 'A',
        'text' => 2,
        'image' => null,
    ]);
});

it('detects option image columns when available', function () {
    $service = new QuizImportService;

    $method = new \ReflectionMethod($service, 'buildColumnConfiguration');
    $method->setAccessible(true);

    $headings = [
        1 => 'Soal / Pertanyaan*',
        2 => 'Gambar Pertanyaan (opsional)',
        3 => 'Jawaban A - Benar*',
        4 => 'Gambar Jawaban A (opsional)',
        5 => 'Jawaban B*',
        6 => 'Gambar Jawaban B (opsional)',
        7 => 'Jawaban C*',
        8 => 'Jawaban Benar*',
    ];

    $configuration = $method->invokeArgs($service, [$headings, 8]);

    expect($configuration['question'])->toBe(1);
    expect($configuration['question_image'])->toBe(2);
    expect($configuration['options'])->toHaveCount(3);
    expect($configuration['options'][0])->toMatchArray([
        'number' => 1,
        'label' => 'A',
        'text' => 3,
        'image' => 4,
    ]);
});

it('supports legacy opsi headings for backward compatibility', function () {
    $service = new QuizImportService;

    $method = new \ReflectionMethod($service, 'buildColumnConfiguration');
    $method->setAccessible(true);

    $headings = [
        1 => 'Soal / Pertanyaan*',
        2 => 'Opsi 1*',
        3 => 'Opsi 2*',
        4 => 'Opsi 3*',
        5 => 'Jawaban Benar*',
    ];

    $configuration = $method->invokeArgs($service, [$headings, 5]);

    expect($configuration['options'])->toHaveCount(3);
    expect($configuration['options'][0])->toMatchArray([
        'number' => 1,
        'label' => 'A',
        'text' => 2,
        'image' => null,
    ]);
});

it('formats option slot labels in spreadsheet notation', function () {
    $service = new QuizImportService;

    $method = new \ReflectionMethod($service, 'optionSlotLabel');
    $method->setAccessible(true);

    expect($method->invokeArgs($service, [0]))->toBe('A');
    expect($method->invokeArgs($service, [1]))->toBe('B');
    expect($method->invokeArgs($service, [25]))->toBe('Z');
    expect($method->invokeArgs($service, [26]))->toBe('AA');
});
