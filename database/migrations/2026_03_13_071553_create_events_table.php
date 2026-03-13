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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('date_from');
            $table->date('date_to');
            $table->string('venue');
            $table->timestamp('registration_open_at');
            $table->timestamp('registration_close_at');
            $table->unsignedInteger('total_capacity');
            $table->string('status')->default('draft')->index();
            $table->timestamps();

            $table->index(['registration_open_at', 'registration_close_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
