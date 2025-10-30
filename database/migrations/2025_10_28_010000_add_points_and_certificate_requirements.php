<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::table('quiz_questions', function (Blueprint $table): void {
            $table->unsignedInteger('points')->default(10)->after('order');
        });

        Schema::table('quiz_results', function (Blueprint $table): void {
            $table->unsignedInteger('earned_points')->default(0)->after('score');
            $table->unsignedInteger('total_points')->default(0)->after('earned_points');
        });

        Schema::table('courses', function (Blueprint $table): void {
            $table->unsignedInteger('certificate_required_points')->nullable()->after('certificate_qr_box_height');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('courses', function (Blueprint $table): void {
            $table->dropColumn('certificate_required_points');
        });

        Schema::table('quiz_results', function (Blueprint $table): void {
            $table->dropColumn(['earned_points', 'total_points']);
        });

        Schema::table('quiz_questions', function (Blueprint $table): void {
            $table->dropColumn('points');
        });
    }
};
