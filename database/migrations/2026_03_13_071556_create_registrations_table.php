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
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pastor_id')->constrained()->restrictOnDelete();
            $table->foreignId('encoded_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('registration_mode')->index();
            $table->string('payment_status')->default('unpaid')->index();
            $table->string('registration_status')->default('draft')->index();
            $table->string('payment_reference')->nullable();
            $table->string('receipt_file_path')->nullable();
            $table->string('receipt_original_name')->nullable();
            $table->timestamp('receipt_uploaded_at')->nullable();
            $table->foreignId('receipt_uploaded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['event_id', 'pastor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
