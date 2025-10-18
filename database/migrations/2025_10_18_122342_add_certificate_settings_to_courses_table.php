<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::table('courses', function (Blueprint $table): void {
            $table->unsignedTinyInteger('certificate_name_position_x')
                ->nullable()
                ->after('certificate_template');
            $table->unsignedTinyInteger('certificate_name_position_y')
                ->nullable()
                ->after('certificate_name_position_x');
            $table->unsignedSmallInteger('certificate_name_max_length')
                ->nullable()
                ->after('certificate_name_position_y');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('courses', function (Blueprint $table): void {
            $table->dropColumn([
                'certificate_name_position_x',
                'certificate_name_position_y',
                'certificate_name_max_length',
            ]);
        });
    }
};
