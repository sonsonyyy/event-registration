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
        Schema::create('registration_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('altered_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->json('snapshot');
            $table->timestamp('altered_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registration_histories');
    }
};
