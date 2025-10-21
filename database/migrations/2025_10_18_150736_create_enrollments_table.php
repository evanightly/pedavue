<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->integer('progress')->default(0);
            $table->dateTime('completed_at')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('course_id')->constrained('courses');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('enrollments');
    }
};
