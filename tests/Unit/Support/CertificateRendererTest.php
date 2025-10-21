<?php

use App\Models\Course;
use App\Models\CourseCertificateImage;
use App\Models\User;
use App\Support\CertificateRenderer;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class);

it('renders the participant name onto the certificate template', function (): void {
    $width = 800;
    $height = 600;

    $template = imagecreatetruecolor($width, $height);
    $background = imagecolorallocate($template, 240, 244, 255);
    imagefill($template, 0, 0, $background);

    $templatePath = tempnam(sys_get_temp_dir(), 'certificate_template_');
    imagepng($template, $templatePath);
    imagedestroy($template);

    $course = new Course;
    $course->forceFill([
        'slug' => 'unit-test-course',
        'title' => 'Unit Test Course',
        'certification_enabled' => true,
        'certificate_name_position_x' => 50,
        'certificate_name_position_y' => 50,
        'certificate_name_box_width' => 60,
        'certificate_name_box_height' => 20,
        'certificate_name_text_align' => 'left',
        'certificate_name_text_color' => '#000000',
        'certificate_name_font_family' => 'sans-serif',
        'certificate_name_font_weight' => '700',
        'certificate_name_letter_spacing' => 0,
    ]);
    $course->setRelation('certificate_images', collect());

    $user = new User;
    $user->forceFill([
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);

    $renderer = new CertificateRenderer;
    $rendered = $renderer->render($course, $user, $templatePath, 'png', 'https://example.com/verify');

    $result = imagecreatefrompng($rendered['path']);

    $contentLeft = (int) round($width * 0.5 - ($width * 0.6) / 2) + 16;
    $contentTop = (int) round($height * 0.5 - ($height * 0.2) / 2) + 16;
    $contentRight = (int) round($width * 0.5 + ($width * 0.6) / 2) - 16;
    $contentBottom = (int) round($height * 0.5 + ($height * 0.2) / 2) - 16;

    $backgroundRgb = [240, 244, 255];
    $detected = false;

    for ($y = $contentTop; $y <= $contentBottom; $y += 5) {
        for ($x = $contentLeft; $x <= $contentRight; $x += 5) {
            $colorIndex = imagecolorat($result, $x, $y);
            $red = ($colorIndex >> 16) & 0xFF;
            $green = ($colorIndex >> 8) & 0xFF;
            $blue = $colorIndex & 0xFF;

            if ($red !== $backgroundRgb[0] || $green !== $backgroundRgb[1] || $blue !== $backgroundRgb[2]) {
                $detected = true;
                break 2;
            }
        }
    }

    imagedestroy($result);
    unlink($templatePath);
    unlink($rendered['path']);

    expect($detected)->toBeTrue();
});

it('renders certificate overlays while keeping their aspect ratio', function (): void {
    Storage::fake('public');

    $width = 900;
    $height = 600;

    $template = imagecreatetruecolor($width, $height);
    $background = imagecolorallocate($template, 240, 244, 255);
    imagefill($template, 0, 0, $background);

    $templatePath = tempnam(sys_get_temp_dir(), 'certificate_template_');
    imagepng($template, $templatePath);
    imagedestroy($template);

    $overlayImage = imagecreatetruecolor(400, 120);
    imagealphablending($overlayImage, false);
    imagesavealpha($overlayImage, true);
    $transparent = imagecolorallocatealpha($overlayImage, 0, 0, 0, 127);
    imagefill($overlayImage, 0, 0, $transparent);
    $overlayColor = imagecolorallocatealpha($overlayImage, 30, 30, 30, 0);
    imagefilledrectangle($overlayImage, 0, 0, 399, 119, $overlayColor);

    ob_start();
    imagepng($overlayImage);
    $overlayContents = ob_get_clean() ?: '';
    imagedestroy($overlayImage);

    Storage::disk('public')->put('overlays/aspect-overlay.png', $overlayContents);

    $course = new Course;
    $course->forceFill([
        'slug' => 'aspect-course',
        'title' => 'Aspect Test',
        'certification_enabled' => true,
        'certificate_name_position_x' => 50,
        'certificate_name_position_y' => 40,
    ]);

    $overlayModel = new CourseCertificateImage;
    $overlayModel->forceFill([
        'file_path' => 'overlays/aspect-overlay.png',
        'position_x' => 50,
        'position_y' => 80,
        'width' => 30,
        'height' => 24,
        'z_index' => 1,
        'label' => 'Aspect Overlay',
    ]);

    $course->setRelation('certificate_images', collect([$overlayModel]));

    $user = new User;
    $user->forceFill([
        'name' => 'Aspect Tester',
        'email' => 'aspect@example.com',
    ]);

    $renderer = new CertificateRenderer;
    $rendered = $renderer->render($course, $user, $templatePath, 'png', 'https://example.com/verify');

    $result = imagecreatefrompng($rendered['path']);

    $targetWidth = (int) round($width * 0.30);
    $targetHeight = (int) round($height * 0.24);
    $boxLeft = (int) round(0.50 * $width - ($targetWidth / 2));
    $boxTop = (int) round(0.80 * $height - ($targetHeight / 2));

    $extract = static fn (int $color): array => [
        'r' => ($color >> 16) & 0xFF,
        'g' => ($color >> 8) & 0xFF,
        'b' => $color & 0xFF,
    ];

    $centerX = $boxLeft + (int) floor($targetWidth / 2);
    $centerY = $boxTop + (int) floor($targetHeight / 2);
    $topSampleY = $boxTop + max(1, (int) floor($targetHeight * 0.1));

    $center = $extract(imagecolorat($result, $centerX, $centerY));
    $top = $extract(imagecolorat($result, $centerX, $topSampleY));

    imagedestroy($result);
    unlink($templatePath);
    unlink($rendered['path']);

    expect($center['r'])->toBeLessThan(80);
    expect($top['r'])->toBeGreaterThan(200)
        ->and($top['g'])->toBeGreaterThan(200)
        ->and($top['b'])->toBeGreaterThan(200);
});

it('centers the qr code within its bounding box without stretching', function (): void {
    Storage::fake('public');

    $width = 960;
    $height = 540;

    $template = imagecreatetruecolor($width, $height);
    $background = imagecolorallocate($template, 250, 252, 255);
    imagefill($template, 0, 0, $background);

    $templatePath = tempnam(sys_get_temp_dir(), 'certificate_template_');
    imagepng($template, $templatePath);
    imagedestroy($template);

    $course = new Course;
    $course->forceFill([
        'slug' => 'qr-course',
        'title' => 'QR Test',
        'certification_enabled' => true,
        'certificate_qr_position_x' => 82,
        'certificate_qr_position_y' => 78,
        'certificate_qr_box_width' => 32,
        'certificate_qr_box_height' => 14,
    ]);
    $course->setRelation('certificate_images', collect());

    $user = new User;
    $user->forceFill([
        'name' => 'QR Tester',
        'email' => 'qr@example.com',
    ]);

    $renderer = new CertificateRenderer;
    $rendered = $renderer->render($course, $user, $templatePath, 'png', 'https://example.com/verify');

    $result = imagecreatefrompng($rendered['path']);

    $targetWidth = (int) round($width * 0.32);
    $targetHeight = (int) round($height * 0.14);

    $targetWidth = max(1, min($width, $targetWidth));
    $targetHeight = max(1, min($height, $targetHeight));

    $desiredSquare = max($targetWidth, $targetHeight);
    $maxSquare = min($width, $height);
    $desiredSquare = max(1, min($desiredSquare, $maxSquare));

    $targetWidth = min($width, max($targetWidth, $desiredSquare));
    $targetHeight = min($height, max($targetHeight, $desiredSquare));

    $boxLeft = (int) round(0.82 * $width - ($targetWidth / 2));
    $boxTop = (int) round(0.78 * $height - ($targetHeight / 2));
    $boxLeft = max(0, min($width - $targetWidth, $boxLeft));
    $boxTop = max(0, min($height - $targetHeight, $boxTop));

    $squareSize = min($targetWidth, $targetHeight);
    $squareLeft = $boxLeft + (int) floor(($targetWidth - $squareSize) / 2);
    $squareTop = $boxTop + (int) floor(($targetHeight - $squareSize) / 2);

    expect($squareSize)->toBe($desiredSquare);

    $extract = static fn (int $color): array => [
        'r' => ($color >> 16) & 0xFF,
        'g' => ($color >> 8) & 0xFF,
        'b' => $color & 0xFF,
    ];

    $centerY = $boxTop + (int) floor($targetHeight / 2);
    $leftMarginX = $boxLeft + 2;

    $leftMargin = $extract(imagecolorat($result, $leftMarginX, $centerY));
    $step = 1;
    $hasDarkPixel = false;
    $colourSet = [];

    for ($y = $squareTop + $step; $y < $squareTop + $squareSize - $step; $y += $step) {
        for ($x = $squareLeft + $step; $x < $squareLeft + $squareSize - $step; $x += $step) {
            $sample = $extract(imagecolorat($result, $x, $y));

            $colourSet[sprintf('%d-%d-%d', $sample['r'], $sample['g'], $sample['b'])] = true;

            if ($sample['r'] < 80 && $sample['g'] < 80 && $sample['b'] < 80) {
                $hasDarkPixel = true;

                break 2;
            }
        }
    }

    imagedestroy($result);
    unlink($templatePath);
    unlink($rendered['path']);

    expect($leftMargin['r'])->toBeGreaterThan(200)
        ->and($leftMargin['g'])->toBeGreaterThan(200)
        ->and($leftMargin['b'])->toBeGreaterThan(200);
    expect($hasDarkPixel || count($colourSet) > 1)->toBeTrue();
});

it('ensures the qr size follows the larger configured percentage on wide templates', function (): void {
    $width = 700;
    $height = 394;

    $template = imagecreatetruecolor($width, $height);
    $background = imagecolorallocate($template, 255, 255, 255);
    imagefill($template, 0, 0, $background);

    $templatePath = tempnam(sys_get_temp_dir(), 'certificate_template_');
    imagepng($template, $templatePath);
    imagedestroy($template);

    $course = new Course;
    $course->forceFill([
        'slug' => 'wide-template-course',
        'title' => 'Wide QR Course',
        'certification_enabled' => true,
        'certificate_qr_position_x' => 86,
        'certificate_qr_position_y' => 80,
        'certificate_qr_box_width' => 18,
        'certificate_qr_box_height' => 18,
    ]);
    $course->setRelation('certificate_images', collect());

    $user = new User;
    $user->forceFill([
        'name' => 'Wide QR Tester',
        'email' => 'wide-qr@example.com',
    ]);

    $renderer = new CertificateRenderer;
    $rendered = $renderer->render($course, $user, $templatePath, 'png', 'https://example.com/verify');

    $result = imagecreatefrompng($rendered['path']);

    $initialWidth = (int) round($width * 0.18);
    $initialHeight = (int) round($height * 0.18);

    $targetWidth = max(1, min($width, $initialWidth));
    $targetHeight = max(1, min($height, $initialHeight));

    $desiredSquare = max($targetWidth, $targetHeight);
    $maxSquare = min($width, $height);
    $desiredSquare = max(1, min($desiredSquare, $maxSquare));

    $targetWidth = min($width, max($targetWidth, $desiredSquare));
    $targetHeight = min($height, max($targetHeight, $desiredSquare));

    $boxLeft = (int) round(0.86 * $width - ($targetWidth / 2));
    $boxTop = (int) round(0.80 * $height - ($targetHeight / 2));
    $boxLeft = max(0, min($width - $targetWidth, $boxLeft));
    $boxTop = max(0, min($height - $targetHeight, $boxTop));

    $squareSize = min($targetWidth, $targetHeight);
    $squareLeft = $boxLeft + (int) floor(($targetWidth - $squareSize) / 2);
    $squareTop = $boxTop + (int) floor(($targetHeight - $squareSize) / 2);

    $extract = static fn (int $color): array => [
        'r' => ($color >> 16) & 0xFF,
        'g' => ($color >> 8) & 0xFF,
        'b' => $color & 0xFF,
    ];

    $innerSample = $extract(imagecolorat($result, $squareLeft + (int) floor($squareSize / 2), $squareTop + (int) floor($squareSize / 2)));
    $outsideSample = $extract(imagecolorat($result, max(0, $squareLeft - 2), $squareTop + (int) floor($squareSize / 2)));

    imagedestroy($result);
    unlink($templatePath);
    unlink($rendered['path']);

    expect($squareSize)->toBe($desiredSquare)
        ->and($squareSize)->toBeGreaterThan((int) round(min($initialWidth, $initialHeight)));

    expect($innerSample['r'])->toBeLessThan(70)
        ->and($innerSample['g'])->toBeLessThan(70)
        ->and($innerSample['b'])->toBeLessThan(70);

    expect($outsideSample['r'])->toBeGreaterThan(200)
        ->and($outsideSample['g'])->toBeGreaterThan(200)
        ->and($outsideSample['b'])->toBeGreaterThan(200);
});
