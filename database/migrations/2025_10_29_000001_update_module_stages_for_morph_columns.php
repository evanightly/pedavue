<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        $missingType = !Schema::hasColumn('module_stages', 'module_able_type');
        $missingId = !Schema::hasColumn('module_stages', 'module_able_id');

        if ($missingType || $missingId) {
            Schema::table('module_stages', function (Blueprint $table) use ($missingType, $missingId): void {
                if ($missingType) {
                    $table->string('module_able_type')->nullable()->after('module_id');
                }

                if ($missingId) {
                    $table->unsignedBigInteger('module_able_id')->nullable()->after('module_able_type');
                }

                $table->index(['module_able_type', 'module_able_id'], 'module_stages_module_able_morph_index');
            });
        }

        Schema::table('module_stages', function (Blueprint $table): void {
            if (Schema::hasColumn('module_stages', 'module_content_id')) {
                $table->dropForeign(['module_content_id']);
                $table->dropColumn('module_content_id');
            }

            if (Schema::hasColumn('module_stages', 'module_quiz_id')) {
                $table->dropForeign(['module_quiz_id']);
                $table->dropColumn('module_quiz_id');
            }

            if (Schema::hasColumn('module_stages', 'module_able')) {
                $table->dropColumn('module_able');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('module_stages', function (Blueprint $table): void {
            if (!Schema::hasColumn('module_stages', 'module_able')) {
                $table->string('module_able')->nullable()->after('module_id');
            }

            if (!Schema::hasColumn('module_stages', 'module_content_id')) {
                $table->foreignId('module_content_id')->nullable()->after('module_able_type')->constrained('module_contents')->nullOnDelete();
            }

            if (!Schema::hasColumn('module_stages', 'module_quiz_id')) {
                $table->foreignId('module_quiz_id')->nullable()->after('module_content_id')->constrained('quizzes')->nullOnDelete();
            }
        });

        Schema::table('module_stages', function (Blueprint $table): void {
            if (Schema::hasIndex('module_stages', 'module_stages_module_able_morph_index')) {
                $table->dropIndex('module_stages_module_able_morph_index');
            }

            if (Schema::hasColumn('module_stages', 'module_able_type')) {
                $table->dropColumn('module_able_type');
            }

            if (Schema::hasColumn('module_stages', 'module_able_id')) {
                $table->dropColumn('module_able_id');
            }
        });
    }
};
