<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::table('courses', function (Blueprint $table) {
            $table->unsignedInteger('certificate_name_box_width')->nullable();
            $table->unsignedInteger('certificate_name_box_height')->nullable();
            $table->string('certificate_name_font_family')->nullable();
            $table->string('certificate_name_font_weight', 50)->nullable();
            $table->string('certificate_name_text_align', 20)->nullable();
            $table->string('certificate_name_text_color', 20)->nullable();
            $table->integer('certificate_name_letter_spacing')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'certificate_name_box_width',
                'certificate_name_box_height',
                'certificate_name_font_family',
                'certificate_name_font_weight',
                'certificate_name_text_align',
                'certificate_name_text_color',
                'certificate_name_letter_spacing',
            ]);
        });
    }
};
