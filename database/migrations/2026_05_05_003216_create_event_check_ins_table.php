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
        if (Schema::hasTable('event_check_ins')) {
            return;
        }

        Schema::create('event_check_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->restrictOnDelete();
            $table->foreignId('pastor_id')->constrained()->restrictOnDelete();
            $table->foreignId('checked_in_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('representative_name');
            $table->unsignedInteger('total_claimed_quantity');
            $table->text('remarks')->nullable();
            $table->timestamp('checked_in_at');
            $table->timestamps();

            $table->index(['event_id', 'pastor_id']);
            $table->index('checked_in_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_check_ins');
    }
};
