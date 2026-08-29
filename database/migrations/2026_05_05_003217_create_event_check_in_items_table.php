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
        if (Schema::hasTable('event_check_in_items')) {
            return;
        }

        Schema::create('event_check_in_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_check_in_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fee_category_id')->constrained('event_fee_categories')->restrictOnDelete();
            $table->unsignedInteger('quantity_claimed');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['event_check_in_id', 'fee_category_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_check_in_items');
    }
};
