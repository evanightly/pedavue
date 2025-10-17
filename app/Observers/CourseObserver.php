<?php

namespace App\Observers;

use App\Models\Course;
use Illuminate\Support\Str;

class CourseObserver {
    public function creating(Course $course): void {
        $this->assignSlug($course);
    }

    public function updating(Course $course): void {
        if ($course->isDirty('title') || $course->isDirty('slug')) {
            $this->assignSlug($course);
        }
    }

    protected function assignSlug(Course $course): void {
        $source = $course->isDirty('slug') && filled($course->slug)
            ? $course->slug
            : $course->title;

        $course->slug = $this->generateUniqueSlug($course, $source);
    }

    protected function generateUniqueSlug(Course $course, ?string $value): string {
        $baseSlug = Str::slug($value ?? '');

        if ($baseSlug === '') {
            $baseSlug = Str::slug(Str::random(12));
        }

        $slug = $baseSlug;
        $suffix = 2;

        while ($this->slugExists($course, $slug)) {
            $slug = sprintf('%s-%d', $baseSlug, $suffix);
            $suffix++;
        }

        return $slug;
    }

    protected function slugExists(Course $course, string $slug): bool {
        return Course::query()
            ->when($course->exists, static fn ($query) => $query->where($course->getKeyName(), '!=', $course->getKey()))
            ->where('slug', $slug)
            ->exists();
    }

    public function deleted(Course $course): void {}

    public function restored(Course $course): void {}

    public function forceDeleted(Course $course): void {}
}
