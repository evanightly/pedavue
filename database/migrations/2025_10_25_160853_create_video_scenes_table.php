<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('video_scenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_content_id')->constrained()->onDelete('cascade');
            $table->text('visual')->nullable();
            $table->text('voice_over')->nullable();
            $table->integer('time_chapter')->comment('seconds');
            $table->integer('interaction_trigger_time')->comment('seconds')->nullable();
            $table->enum('interaction_type', ['essay', 'multiple_choice', 'single_choice', 'view_event'])->default('essay');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('video_scenes');
    }
};
