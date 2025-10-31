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
        Schema::create('scene_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_scene_id')->constrained('video_scenes')->onDelete('cascade');

            // Polymorphic relation to any interactable model (quiz, quiz_question, etc.)
            $table->nullableMorphs('interactable');

            // Optional payload to store additional configuration (JSON)
            $table->json('payload')->nullable();

            // Order/position of the interaction within the scene
            $table->integer('position')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scene_interactions');
    }
};
