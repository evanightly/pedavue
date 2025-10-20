<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CertificateVerificationController extends Controller {
    public function show(Request $request, Course $course, Enrollment $enrollment): Response {
        if ($enrollment->course_id !== $course->getKey()) {
            abort(404);
        }

        if ($enrollment->completed_at === null || !$course->certification_enabled) {
            abort(404);
        }

        $enrollment->loadMissing('user');

        return Inertia::render('certificate/verify', [
            'course' => [
                'id' => $course->getKey(),
                'title' => $course->title,
                'slug' => $course->slug,
            ],
            'participant' => [
                'id' => $enrollment->user?->getKey(),
                'name' => $enrollment->user?->name,
                'email' => $enrollment->user?->email,
            ],
            'enrollment' => [
                'id' => $enrollment->getKey(),
                'completed_at' => $enrollment->completed_at?->toIso8601String(),
                'completed_at_label' => $enrollment->completed_at?->locale('id')->translatedFormat('j F Y'),
            ],
            'certificate' => [
                'certification_enabled' => (bool) $course->certification_enabled,
            ],
        ]);
    }
}
