<?php

use App\Models\Course;
use App\Models\User;
use App\Support\CertificateRenderer;

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

    $user = new User;
    $user->forceFill([
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);

    $renderer = new CertificateRenderer;
    $rendered = $renderer->render($course, $user, $templatePath, 'png');

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
