<?php

namespace App\Http\Controllers;

use App\Models\ModuleContent;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ModuleContentStreamController extends Controller {
    use AuthorizesRequests;

    public function __invoke(Request $request, ModuleContent $moduleContent): Response {
        $moduleContent->loadMissing(['module_stage.module.course']);

        $course = $moduleContent->module_stage?->module?->course;

        if ($course === null) {
            abort(404);
        }

        $this->authorize('accessWorkspace', $course);

        $filePath = $moduleContent->file_path;
        $disk = Storage::disk('public');

        if ($filePath === null || trim($filePath) === '' || !$disk->exists($filePath)) {
            abort(404);
        }

        $absolutePath = $disk->path($filePath);
        $mimeType = mime_content_type($absolutePath) ?: 'application/octet-stream';
        $size = (int) $disk->size($filePath);
        $lastModifiedTimestamp = $disk->lastModified($filePath);
        $lastModified = $lastModifiedTimestamp ? Carbon::createFromTimestamp($lastModifiedTimestamp) : null;
        $etagSeed = $moduleContent->updated_at?->timestamp ?? $lastModifiedTimestamp ?? filemtime($absolutePath);
        $etag = sha1($filePath . '|' . $size . '|' . $etagSeed);

        $headers = [
            'Content-Type' => $mimeType,
            'Accept-Ranges' => 'bytes',
            'Content-Disposition' => 'inline; filename="' . basename($filePath) . '"',
            'Cache-Control' => 'private, max-age=0, must-revalidate',
            'ETag' => $etag,
        ];

        if ($lastModified !== null) {
            $headers['Last-Modified'] = $lastModified->toRfc7231String();
        }

        $ifNoneMatch = $request->headers->get('If-None-Match');

        if ($ifNoneMatch !== null) {
            $clientEtags = array_map('trim', explode(',', $ifNoneMatch));

            if (in_array($etag, $clientEtags, true) || in_array('*', $clientEtags, true)) {
                return new StreamedResponse(null, 304, $headers);
            }
        }

        if ($lastModified !== null) {
            $ifModifiedSince = $request->headers->get('If-Modified-Since');

            if ($ifModifiedSince !== null && strtotime($ifModifiedSince) >= $lastModified->timestamp) {
                return new StreamedResponse(null, 304, $headers);
            }
        }

        if ($size <= 0) {
            $headers['Content-Length'] = '0';

            return new StreamedResponse(static function (): void {}, 200, $headers);
        }

        $rangeHeader = $request->headers->get('Range');

        if ($rangeHeader && preg_match('/^bytes=(\d*)-(\d*)$/', $rangeHeader, $matches) === 1) {
            $start = $matches[1] !== '' ? (int) $matches[1] : null;
            $end = $matches[2] !== '' ? (int) $matches[2] : null;

            if ($start === null && $end === null) {
                return new StreamedResponse(null, 416, $this->rangeErrorHeaders($headers, $size));
            }

            if ($start === null) {
                $suffixLength = max(0, (int) $matches[2]);

                if ($suffixLength === 0) {
                    return new StreamedResponse(null, 416, $this->rangeErrorHeaders($headers, $size));
                }

                $start = max(0, $size - $suffixLength);
                $end = $size - 1;
            } else {
                if ($start >= $size) {
                    return new StreamedResponse(null, 416, $this->rangeErrorHeaders($headers, $size));
                }

                if ($end === null || $end >= $size) {
                    $end = $size - 1;
                }
            }

            if ($start < 0 || $end < $start) {
                return new StreamedResponse(null, 416, $this->rangeErrorHeaders($headers, $size));
            }

            $length = $end - $start + 1;

            $rangeHeaders = $headers;
            $rangeHeaders['Content-Length'] = (string) $length;
            $rangeHeaders['Content-Range'] = sprintf('bytes %d-%d/%d', $start, $end, $size);

            return $this->streamFile($absolutePath, $start, $length, 206, $rangeHeaders);
        }

        $fullHeaders = $headers;
        $fullHeaders['Content-Length'] = (string) $size;

        return $this->streamFile($absolutePath, 0, $size, 200, $fullHeaders);
    }

    /**
     * @param  array<string, string>  $headers
     */
    private function streamFile(string $absolutePath, int $start, int $length, int $status, array $headers): StreamedResponse {
        return response()->stream(function () use ($absolutePath, $start, $length): void {
            if ($length <= 0) {
                return;
            }

            $handle = fopen($absolutePath, 'rb');

            if ($handle === false) {
                return;
            }

            try {
                if ($start > 0) {
                    fseek($handle, $start);
                }

                $remaining = $length;
                $chunkSize = 1024 * 1024;

                while ($remaining > 0 && !feof($handle)) {
                    $readLength = (int) min($chunkSize, $remaining);
                    $buffer = fread($handle, $readLength);

                    if ($buffer === false) {
                        break;
                    }

                    echo $buffer;
                    flush();

                    $remaining -= strlen($buffer);
                }
            } finally {
                fclose($handle);
            }
        }, $status, $headers);
    }

    /**
     * @param  array<string, string>  $baseHeaders
     * @return array<string, string>
     */
    private function rangeErrorHeaders(array $baseHeaders, int $size): array {
        $headers = $baseHeaders;
        $headers['Content-Range'] = 'bytes */' . max(0, $size);

        return $headers;
    }
}
