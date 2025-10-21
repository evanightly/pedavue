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
