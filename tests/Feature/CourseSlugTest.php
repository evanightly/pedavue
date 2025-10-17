<?php

use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('generates a slug from the title when creating a course', function () {
    $instructor = User::factory()->create();

    $course = Course::query()->create([
        'title' => 'Laravel Basics',
        'description' => 'Introductory course',
        'certification_enabled' => false,
        'thumbnail' => null,
        'level' => null,
        'duration' => null,
        'instructor_id' => $instructor->id,
    ]);

    expect($course->slug)->toBe('laravel-basics');
});

it('updates the slug when the title changes', function () {
    $instructor = User::factory()->create();

    $course = Course::query()->create([
        'title' => 'Laravel Basics',
        'description' => 'Introductory course',
        'certification_enabled' => false,
        'thumbnail' => null,
        'level' => null,
        'duration' => null,
        'instructor_id' => $instructor->id,
    ]);

    $course->update([
        'title' => 'Advanced Laravel',
    ]);

    expect($course->refresh()->slug)->toBe('advanced-laravel');
});

it('ensures slugs remain unique', function () {
    $instructor = User::factory()->create();

    $first = Course::query()->create([
        'title' => 'Laravel Basics',
        'description' => 'Introductory course',
        'certification_enabled' => false,
        'thumbnail' => null,
        'level' => null,
        'duration' => null,
        'instructor_id' => $instructor->id,
    ]);

    $second = Course::query()->create([
        'title' => 'Laravel Basics',
        'description' => 'Advanced topics',
        'certification_enabled' => false,
        'thumbnail' => null,
        'level' => null,
        'duration' => null,
        'instructor_id' => $instructor->id,
    ]);

    expect($first->slug)->toBe('laravel-basics')
        ->and($second->slug)->toBe('laravel-basics-2');
});

it('normalizes provided slugs and keeps them unique', function () {
    $instructor = User::factory()->create();

    $first = Course::query()->create([
        'title' => 'Something Else',
        'slug' => 'Custom Slug',
        'description' => 'Introductory course',
        'certification_enabled' => false,
        'thumbnail' => null,
        'level' => null,
        'duration' => null,
        'instructor_id' => $instructor->id,
    ]);

    $second = Course::query()->create([
        'title' => 'Another Course',
        'slug' => 'Custom Slug',
        'description' => 'Another course description',
        'certification_enabled' => false,
        'thumbnail' => null,
        'level' => null,
        'duration' => null,
        'instructor_id' => $instructor->id,
    ]);

    expect($first->slug)->toBe('custom-slug')
        ->and($second->slug)->toBe('custom-slug-2');
});
