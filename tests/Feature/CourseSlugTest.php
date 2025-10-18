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
    ]);

    $course->course_instructors()->attach($instructor);

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
    ]);

    $course->course_instructors()->attach($instructor);

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
    ]);

    $first->course_instructors()->attach($instructor);

    $second = Course::query()->create([
        'title' => 'Laravel Basics',
        'description' => 'Advanced topics',
        'certification_enabled' => false,
        'thumbnail' => null,
        'level' => null,
        'duration' => null,
    ]);

    $second->course_instructors()->attach($instructor);

    expect($first->slug)->toBe('laravel-basics')
        ->and($second->slug)->toBe('laravel-basics-2');
});

it('generates unique slugs when titles are identical', function () {
    $instructor = User::factory()->create();

    $first = Course::query()->create([
        'title' => 'Laravel Basics',
        'description' => 'First course',
        'certification_enabled' => false,
        'thumbnail' => null,
        'level' => null,
        'duration' => null,
    ]);

    $first->course_instructors()->attach($instructor);

    $second = Course::query()->create([
        'title' => 'Laravel Basics',
        'description' => 'Second course with same title',
        'certification_enabled' => false,
        'thumbnail' => null,
        'level' => null,
        'duration' => null,
    ]);

    $second->course_instructors()->attach($instructor);

    $third = Course::query()->create([
        'title' => 'Laravel Basics',
        'description' => 'Third course with same title',
        'certification_enabled' => false,
        'thumbnail' => null,
        'level' => null,
        'duration' => null,
    ]);

    $third->course_instructors()->attach($instructor);

    expect($first->slug)->toBe('laravel-basics')
        ->and($second->slug)->toBe('laravel-basics-2')
        ->and($third->slug)->toBe('laravel-basics-3');
});
