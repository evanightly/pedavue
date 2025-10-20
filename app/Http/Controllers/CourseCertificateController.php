<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Support\CertificateRenderer;
use App\Support\WorkspaceProgressManager;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class CourseCertificateController extends Controller {
    use AuthorizesRequests;

    public function __construct(
        private WorkspaceProgressManager $progressManager,
        private CertificateRenderer $certificateRenderer,
    ) {}

    public function download(Request $request, Course $course): BinaryFileResponse {
        $this->authorize('accessWorkspace', $course);

        if (!$course->certification_enabled) {
            abort(404, 'Sertifikat belum tersedia untuk kursus ini.');
        }

        $templatePath = $course->certificate_template;

        if ($templatePath === null || trim($templatePath) === '' || !Storage::disk('public')->exists($templatePath)) {
            abort(404, 'Template sertifikat belum disiapkan oleh instruktur.');
        }

        $enrollment = $this->progressManager->getEnrollmentFor($request->user(), $course);

        if ($enrollment->completed_at === null) {
            abort(403, 'Selesaikan seluruh tahap untuk mengunduh sertifikat.');
        }

        $extension = pathinfo($templatePath, PATHINFO_EXTENSION) ?: 'png';
        $absolutePath = Storage::disk('public')->path($templatePath);

        $enrollment->loadMissing('user');

        try {
            $rendered = $this->certificateRenderer->render($course, $enrollment->user, $absolutePath, $extension);
        } catch (\Throwable $exception) {
            report($exception);

            abort(Response::HTTP_INTERNAL_SERVER_ERROR, 'Sertifikat tidak dapat diproses saat ini.');
        }

        $filename = sprintf('%s-certificate.%s', Str::slug($course->slug), $rendered['extension']);

        return response()
            ->download($rendered['path'], $filename)
            ->deleteFileAfterSend(true);
    }
}
