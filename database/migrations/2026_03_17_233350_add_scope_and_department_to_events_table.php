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
        Schema::table('events', function (Blueprint $table) {
            $table->string('scope_type')
                ->default('district')
                ->after('status')
                ->index();
            $table->foreignId('section_id')
                ->nullable()
                ->after('scope_type')
                ->constrained()
                ->nullOnDelete();
            $table->foreignId('department_id')
                ->nullable()
                ->after('section_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
            $table->dropConstrainedForeignId('section_id');
            $table->dropColumn('scope_type');
        });
    }
};
