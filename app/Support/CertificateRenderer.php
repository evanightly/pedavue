<?php

namespace App\Support;

use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Str;
use RuntimeException;

class CertificateRenderer {
    private const DEFAULT_FONT_FAMILY = 'sans-serif';

    private const DEFAULT_FONT_WEIGHT = '600';

    private const DEFAULT_TEXT_COLOR = '#111827';

    private const DEFAULT_BOX_WIDTH_PERCENT = 40;

    private const DEFAULT_BOX_HEIGHT_PERCENT = 16;

    private const DEFAULT_POSITION_PERCENT = 50;

    private const MIN_FONT_SIZE = 12;

    private const MAX_FONT_SIZE = 200;

    private const BOX_PADDING = 16;

    private const BUILTIN_FONT = 5;

    /**
     * @var array<string, array<string, list<string>>>
     */
    private const FONT_CANDIDATE_PATHS = [
        'sans-serif' => [
            '400' => [
                'resources/fonts/certificate/sans-serif-400.ttf',
                'resources/fonts/certificate/sans-serif-regular.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
            ],
            '500' => [
                'resources/fonts/certificate/sans-serif-500.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
            ],
            '600' => [
                'resources/fonts/certificate/sans-serif-600.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            ],
            '700' => [
                'resources/fonts/certificate/sans-serif-700.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            ],
            '800' => [
                'resources/fonts/certificate/sans-serif-800.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            ],
        ],
        'serif' => [
            '400' => [
                'resources/fonts/certificate/serif-400.ttf',
                'resources/fonts/certificate/serif-regular.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
            ],
            '500' => [
                'resources/fonts/certificate/serif-500.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
            ],
            '600' => [
                'resources/fonts/certificate/serif-600.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
            ],
            '700' => [
                'resources/fonts/certificate/serif-700.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
            ],
            '800' => [
                'resources/fonts/certificate/serif-800.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
            ],
        ],
    ];

    /**
     * @return array{path: string, extension: string}
     */
    public function render(Course $course, User $user, string $templatePath, string $extension): array {
        $image = $this->createImageFromTemplate($templatePath);
        $width = imagesx($image);
        $height = imagesy($image);

        $name = $this->truncateName($user->name ?? '');
        $name = $this->applyNameLimit($name, $course->certificate_name_max_length);
        $name = $name === '' ? 'Peserta' : $name;

        $boxWidthPercent = $course->certificate_name_box_width ?? self::DEFAULT_BOX_WIDTH_PERCENT;
        $boxHeightPercent = $course->certificate_name_box_height ?? self::DEFAULT_BOX_HEIGHT_PERCENT;
        $boxCenterXPercent = $course->certificate_name_position_x ?? self::DEFAULT_POSITION_PERCENT;
        $boxCenterYPercent = $course->certificate_name_position_y ?? self::DEFAULT_POSITION_PERCENT;

        $boxWidth = max(1, (int) round($width * ($boxWidthPercent / 100)));
        $boxHeight = max(1, (int) round($height * ($boxHeightPercent / 100)));
        $boxLeft = (int) round(($boxCenterXPercent / 100) * $width - ($boxWidth / 2));
        $boxTop = (int) round(($boxCenterYPercent / 100) * $height - ($boxHeight / 2));

        $boxLeft = max(0, min($width - $boxWidth, $boxLeft));
        $boxTop = max(0, min($height - $boxHeight, $boxTop));

        $padding = (int) min(self::BOX_PADDING, max(0, min($boxWidth, $boxHeight) / 6));
        $contentLeft = $boxLeft + $padding;
        $contentTop = $boxTop + $padding;
        $contentWidth = max(1, $boxWidth - ($padding * 2));
        $contentHeight = max(1, $boxHeight - ($padding * 2));

        $fontFamily = $this->normalizeFontFamily($course->certificate_name_font_family);
        $fontWeight = $this->normalizeFontWeight($course->certificate_name_font_weight);
        $textAlign = $this->normalizeTextAlign($course->certificate_name_text_align);
        $letterSpacing = $this->normalizeLetterSpacing($course->certificate_name_letter_spacing);
        $hexColor = $this->normalizeTextColor($course->certificate_name_text_color);

        $fontPath = $this->resolveFontPath($fontFamily, $fontWeight);
        $textColor = $this->allocateColor($image, $hexColor);

        if ($fontPath !== null) {
            $fontSize = $this->determineFontSize($name, $fontPath, $letterSpacing, $contentWidth, $contentHeight);
            $metrics = $this->measureText($name, $fontPath, $fontSize, $letterSpacing);

            $x = $this->resolveAlignedX($contentLeft, $contentWidth, $metrics['width'], $textAlign);
            $y = (int) round($contentTop + $metrics['ascent']);

            $maxBaseline = (int) round($contentTop + $contentHeight);
            if ($y > $maxBaseline) {
                $y = $maxBaseline;
            }

            $this->drawText($image, $fontPath, $fontSize, $x, $y, $textColor, $name, $letterSpacing);
        } else {
            $this->drawWithBuiltInFont($image, $name, $contentLeft, $contentTop, $contentWidth, $contentHeight, $textAlign, $textColor);
        }

        $renderedExtension = $this->normalizeExtension($extension);
        $outputPath = $this->writeImageToTemporaryPath($image, $renderedExtension);
        imagedestroy($image);

        return [
            'path' => $outputPath,
            'extension' => $renderedExtension,
        ];
    }

    private function truncateName(string $name): string {
        $trimmed = trim($name);

        if ($trimmed !== '') {
            return $trimmed;
        }

        return 'Peserta';
    }

    private function applyNameLimit(string $name, ?int $limit): string {
        if ($limit === null || $limit <= 0) {
            return $name;
        }

        if (mb_strlen($name) <= $limit) {
            return $name;
        }

        return mb_substr($name, 0, $limit);
    }

    private function normalizeFontFamily(?string $value): string {
        if ($value === 'serif') {
            return 'serif';
        }

        return self::DEFAULT_FONT_FAMILY;
    }

    private function normalizeFontWeight(?string $value): string {
        $allowed = ['400', '500', '600', '700', '800'];

        if (is_string($value) && in_array($value, $allowed, true)) {
            return $value;
        }

        return self::DEFAULT_FONT_WEIGHT;
    }

    private function normalizeTextAlign(?string $value): string {
        if (in_array($value, ['left', 'center', 'right'], true)) {
            return $value;
        }

        return 'center';
    }

    private function normalizeLetterSpacing(?int $value): int {
        if ($value === null) {
            return 0;
        }

        return max(-10, min(20, $value));
    }

    private function normalizeTextColor(?string $value): string {
        if (is_string($value) && preg_match('/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/', $value) === 1) {
            return Str::upper($value);
        }

        return self::DEFAULT_TEXT_COLOR;
    }

    private function normalizeExtension(string $extension): string {
        $normalized = strtolower($extension);

        if (in_array($normalized, ['png', 'jpg', 'jpeg', 'webp'], true)) {
            return $normalized === 'jpeg' ? 'jpg' : $normalized;
        }

        return 'png';
    }

    private function createImageFromTemplate(string $path) {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($extension) {
            'png' => imagecreatefrompng($path),
            'jpg', 'jpeg' => imagecreatefromjpeg($path),
            'webp' => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($path) : $this->createImageFromBinary($path),
            default => $this->createImageFromBinary($path),
        };
    }

    private function createImageFromBinary(string $path) {
        $contents = @file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException('Template sertifikat tidak dapat dibaca.');
        }

        $resource = @imagecreatefromstring($contents);

        if ($resource === false) {
            throw new RuntimeException('Template sertifikat tidak dikenali.');
        }

        return $resource;
    }

    private function resolveFontPath(string $family, string $weight): ?string {
        $candidates = self::FONT_CANDIDATE_PATHS[$family][$weight] ?? [];

        foreach ($candidates as $candidate) {
            $path = $this->absolutePath($candidate);

            if ($path !== null && is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    private function absolutePath(string $path): ?string {
        if ($path === '') {
            return null;
        }

        if (Str::startsWith($path, '/')) {
            return $path;
        }

        if (function_exists('base_path') && function_exists('app') && method_exists(app(), 'basePath')) {
            return base_path($path);
        }

        $cwd = getcwd();

        if ($cwd === false) {
            return null;
        }

        return $cwd . DIRECTORY_SEPARATOR . ltrim($path, DIRECTORY_SEPARATOR);
    }

    private function determineFontSize(string $text, string $fontPath, int $letterSpacing, int $maxWidth, int $maxHeight): int {
        $min = 6;
        $max = min(self::MAX_FONT_SIZE, max($maxWidth, $maxHeight, self::MIN_FONT_SIZE));
        $best = $min;
        $fits = false;

        while ($min <= $max) {
            $mid = (int) floor(($min + $max) / 2);
            $metrics = $this->measureText($text, $fontPath, $mid, $letterSpacing);

            if ($metrics['width'] <= $maxWidth && $metrics['height'] <= $maxHeight) {
                $fits = true;
                $best = $mid;
                $min = $mid + 1;
            } else {
                $max = $mid - 1;
            }
        }

        if (!$fits) {
            $best = 6;

            while ($best > 2) {
                $metrics = $this->measureText($text, $fontPath, $best, $letterSpacing);

                if ($metrics['width'] <= $maxWidth && $metrics['height'] <= $maxHeight) {
                    return $best;
                }

                $best--;
            }
        }

        return max(2, $best);
    }

    /**
     * @return array{width: float, height: float, ascent: float}
     */
    private function measureText(string $text, string $fontPath, int $fontSize, int $letterSpacing): array {
        if ($letterSpacing === 0) {
            $box = imagettfbbox($fontSize, 0, $fontPath, $text);
            $width = abs($box[2] - $box[0]);
            $ascent = abs($box[7]);
            $descent = abs($box[1]);

            return [
                'width' => $width,
                'height' => $ascent + $descent,
                'ascent' => $ascent,
            ];
        }

        $chars = preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY);
        $width = 0.0;
        $ascent = 0.0;
        $descent = 0.0;

        foreach ($chars as $index => $char) {
            $box = imagettfbbox($fontSize, 0, $fontPath, $char);
            $charWidth = abs($box[2] - $box[0]);
            $charAscent = abs($box[7]);
            $charDescent = abs($box[1]);

            $width += $charWidth;

            if ($index < count($chars) - 1) {
                $width += $letterSpacing;
            }

            $ascent = max($ascent, $charAscent);
            $descent = max($descent, $charDescent);
        }

        return [
            'width' => $width,
            'height' => $ascent + $descent,
            'ascent' => $ascent,
        ];
    }

    private function resolveAlignedX(int $boxLeft, int $boxWidth, float $textWidth, string $align): int {
        return match ($align) {
            'left' => $boxLeft,
            'right' => (int) round($boxLeft + $boxWidth - $textWidth),
            default => (int) round($boxLeft + ($boxWidth - $textWidth) / 2),
        };
    }

    private function drawText($image, string $fontPath, int $fontSize, int $x, int $y, int $color, string $text, int $letterSpacing): void {
        if ($letterSpacing === 0) {
            imagettftext($image, $fontSize, 0, $x, $y, $color, $fontPath, $text);

            return;
        }

        $chars = preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY);
        $cursorX = (float) $x;

        foreach ($chars as $index => $char) {
            imagettftext($image, $fontSize, 0, (int) round($cursorX), $y, $color, $fontPath, $char);
            $box = imagettfbbox($fontSize, 0, $fontPath, $char);
            $charWidth = abs($box[2] - $box[0]);
            $cursorX += $charWidth;

            if ($index < count($chars) - 1) {
                $cursorX += $letterSpacing;
            }
        }
    }

    private function drawWithBuiltInFont($image, string $text, int $boxLeft, int $boxTop, int $boxWidth, int $boxHeight, string $align, int $color): void {
        $font = self::BUILTIN_FONT;
        $charWidth = imagefontwidth($font);
        $charHeight = imagefontheight($font);
        $textWidth = $charWidth * strlen($text);
        $textHeight = $charHeight;

        $x = match ($align) {
            'left' => $boxLeft,
            'right' => max($boxLeft, $boxLeft + $boxWidth - $textWidth),
            default => max($boxLeft, (int) round($boxLeft + ($boxWidth - $textWidth) / 2)),
        };
        $y = max($boxTop, (int) round($boxTop + ($boxHeight - $textHeight) / 2));

        imagestring($image, $font, $x, $y, $text, $color);
    }

    private function allocateColor($image, string $hex): int {
        $hex = ltrim($hex, '#');

        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }

        $red = hexdec(substr($hex, 0, 2));
        $green = hexdec(substr($hex, 2, 2));
        $blue = hexdec(substr($hex, 4, 2));

        imagealphablending($image, true);
        imagesavealpha($image, true);

        return imagecolorallocatealpha($image, $red, $green, $blue, 0);
    }

    private function writeImageToTemporaryPath($image, string $extension): string {
        $temporary = tempnam(sys_get_temp_dir(), 'cert_');

        if ($temporary === false) {
            throw new RuntimeException('Tidak dapat menyiapkan berkas sementara untuk sertifikat.');
        }

        $targetPath = $temporary . '.' . $extension;
        rename($temporary, $targetPath);

        switch ($extension) {
            case 'png':
                imagepng($image, $targetPath);
                break;
            case 'webp':
                if (function_exists('imagewebp')) {
                    imagewebp($image, $targetPath, 90);
                    break;
                }
                imagepng($image, $targetPath);
                break;
            case 'jpg':
            default:
                imagejpeg($image, $targetPath, 90);
                break;
        }

        return $targetPath;
    }
}
