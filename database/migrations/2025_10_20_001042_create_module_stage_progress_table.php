<?php

use App\Support\Enums\ModuleStageProgressStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('module_stage_progress', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->cascadeOnDelete();
            $table->foreignId('module_stage_id')->constrained('module_stages')->cascadeOnDelete();
            $table->foreignId('quiz_result_id')->nullable()->constrained('quiz_results')->nullOnDelete();
            $table->string('status', 40)->default(ModuleStageProgressStatus::Pending);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->json('state')->nullable();
            $table->timestamps();

            $table->unique(['enrollment_id', 'module_stage_id'], 'module_stage_progress_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('module_stage_progress');
    }
};
