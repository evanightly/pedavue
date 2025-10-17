<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('slug')->unique();
            $table->text('description');
            $table->boolean('certification_enabled')->default(false);
            $table->string('thumbnail')->nullable();
            $table->string('level')->nullable();
            $table->string('duration')->nullable();
            $table->foreignId('instructor_id')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('courses');
    }
};
