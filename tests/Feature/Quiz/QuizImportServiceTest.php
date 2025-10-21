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
