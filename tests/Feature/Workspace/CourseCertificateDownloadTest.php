<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Support\Enums\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    ensureRoleExists(RoleEnum::Student);
});

it('allows a completed enrollee to download a personalised certificate', function (): void {
    Storage::fake('public');

    $template = imagecreatetruecolor(1280, 720);
    $background = imagecolorallocate($template, 219, 234, 254);
    imagefill($template, 0, 0, $background);

    $temporaryPath = tempnam(sys_get_temp_dir(), 'template_');
    imagepng($template, $temporaryPath);
    imagedestroy($template);

    $relativePath = 'courses/certificates/template.png';
    Storage::disk('public')->put($relativePath, file_get_contents($temporaryPath));
    unlink($temporaryPath);

    $course = Course::factory()->create([
        'slug' => 'laravel-certificate',
        'certification_enabled' => true,
        'certificate_template' => $relativePath,
        'certificate_name_position_x' => 50,
        'certificate_name_position_y' => 50,
        'certificate_name_box_width' => 60,
        'certificate_name_box_height' => 18,
        'certificate_name_font_family' => 'sans-serif',
        'certificate_name_font_weight' => '700',
        'certificate_name_text_align' => 'center',
        'certificate_name_text_color' => '#111827',
    ]);

    /** @var User $student */
    $student = User::factory()->create();
    $student->assignRole(RoleEnum::Student->value);

    Enrollment::factory()->create([
        'course_id' => $course->getKey(),
        'user_id' => $student->getKey(),
        'progress' => 100,
        'completed_at' => now(),
    ]);

    actingAs($student)
        ->get(route('courses.workspace.certificate.download', $course))
        ->assertOk()
        ->assertDownload(Str::slug($course->slug) . '-certificate.png');
});

it('rejects certificate download when learning path is unfinished', function (): void {
    Storage::fake('public');

    $template = imagecreatetruecolor(640, 360);
    $background = imagecolorallocate($template, 219, 234, 254);
    imagefill($template, 0, 0, $background);

    $temporaryPath = tempnam(sys_get_temp_dir(), 'template_');
    imagepng($template, $temporaryPath);
    imagedestroy($template);

    $relativePath = 'courses/certificates/in-progress.png';
    Storage::disk('public')->put($relativePath, file_get_contents($temporaryPath));
    unlink($temporaryPath);

    $course = Course::factory()->create([
        'slug' => 'unfinished-course',
        'certification_enabled' => true,
        'certificate_template' => $relativePath,
    ]);

    /** @var User $student */
    $student = User::factory()->create();
    $student->assignRole(RoleEnum::Student->value);

    Enrollment::factory()->create([
        'course_id' => $course->getKey(),
        'user_id' => $student->getKey(),
        'progress' => 80,
        'completed_at' => null,
    ]);

    actingAs($student)
        ->get(route('courses.workspace.certificate.download', $course))
        ->assertForbidden();
});
