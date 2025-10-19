<?php

use App\Models\Quiz;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

it('returns a descriptive error when the Excel file exceeds 10 MB', function () {
    $user = User::factory()->create();
    $quiz = Quiz::factory()->create();

    $this->actingAs($user);

    $oversizedFile = UploadedFile::fake()->create(
        'template.xlsx',
        (10 * 1024) + 512,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    $response = $this->post(
        route('quizzes.import.preview', ['quiz' => $quiz]),
        ['file' => $oversizedFile],
        ['Accept' => 'application/json']
    );

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['file']);
    expect($response->json('errors.file')[0])->toContain('10 MB');
});
