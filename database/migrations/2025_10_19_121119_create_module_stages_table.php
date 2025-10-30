<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('module_stages', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('order')->default(1);
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->string('module_able_type')->nullable();
            $table->unsignedBigInteger('module_able_id')->nullable();
            $table->index(['module_able_type', 'module_able_id'], 'module_stages_module_able_morph_index');
            $table->timestamps();
        });

        Schema::table('module_contents', function (Blueprint $table) {
            $table
                ->foreign('module_stage_id')
                ->references('id')
                ->on('module_stages')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('module_contents', function (Blueprint $table) {
            $table->dropForeign(['module_stage_id']);
        });

        Schema::dropIfExists('module_stages');
    }
};
