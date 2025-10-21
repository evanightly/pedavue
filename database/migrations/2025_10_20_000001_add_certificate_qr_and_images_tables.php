<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('courses', function (Blueprint $table): void {
            $table->unsignedTinyInteger('certificate_qr_position_x')->nullable()->after('certificate_name_letter_spacing');
            $table->unsignedTinyInteger('certificate_qr_position_y')->nullable()->after('certificate_qr_position_x');
            $table->unsignedTinyInteger('certificate_qr_box_width')->nullable()->after('certificate_qr_position_y');
            $table->unsignedTinyInteger('certificate_qr_box_height')->nullable()->after('certificate_qr_box_width');
        });

        Schema::create('course_certificate_images', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->unsignedTinyInteger('position_x')->default(50);
            $table->unsignedTinyInteger('position_y')->default(50);
            $table->unsignedTinyInteger('width')->default(20);
            $table->unsignedTinyInteger('height')->default(20);
            $table->integer('z_index')->default(0);
            $table->string('label')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('course_certificate_images');

        Schema::table('courses', function (Blueprint $table): void {
            $table->dropColumn([
                'certificate_qr_position_x',
                'certificate_qr_position_y',
                'certificate_qr_box_width',
                'certificate_qr_box_height',
            ]);
        });
    }
};
