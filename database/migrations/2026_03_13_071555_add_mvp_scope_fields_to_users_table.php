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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('password')->constrained()->nullOnDelete();
            $table->foreignId('district_id')->nullable()->after('role_id')->constrained()->nullOnDelete();
            $table->foreignId('section_id')->nullable()->after('district_id')->constrained()->nullOnDelete();
            $table->foreignId('pastor_id')->nullable()->after('section_id')->constrained()->nullOnDelete();
            $table->string('status')->default('active')->after('pastor_id')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pastor_id');
            $table->dropConstrainedForeignId('section_id');
            $table->dropConstrainedForeignId('district_id');
            $table->dropConstrainedForeignId('role_id');
            $table->dropColumn('status');
        });
    }
};
