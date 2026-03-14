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
            $table->string('approval_status')
                ->default('approved')
                ->after('status')
                ->index();
            $table->string('account_source')
                ->default('admin')
                ->after('approval_status')
                ->index();
            $table->foreignId('approval_reviewed_by_user_id')
                ->nullable()
                ->after('account_source')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('approval_reviewed_at')
                ->nullable()
                ->after('approval_reviewed_by_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approval_reviewed_by_user_id');
            $table->dropColumn([
                'approval_status',
                'account_source',
                'approval_reviewed_at',
            ]);
        });
    }
};
