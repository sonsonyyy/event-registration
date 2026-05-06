<?php

namespace Database\Factories;

use App\Models\Registration;
use App\Models\RegistrationHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RegistrationHistory>
 */
class RegistrationHistoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'registration_id' => Registration::factory(),
            'altered_by_user_id' => User::factory(),
            'snapshot' => [
                'registration' => [
                    'event_id' => 1,
                    'event_name' => fake()->sentence(3),
                    'pastor_id' => 1,
                    'church_name' => fake()->company(),
                    'pastor_name' => fake()->name(),
                    'encoded_by_user_id' => 1,
                    'encoded_by_name' => fake()->name(),
                    'registration_mode' => Registration::MODE_ONLINE,
                    'payment_status' => Registration::PAYMENT_STATUS_PAID,
                    'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
                    'payment_reference' => fake()->regexify('[A-Z]{3}-2026-[0-9]{4}'),
                    'receipt_file_path' => 'registration-receipts/sample.pdf',
                    'receipt_original_name' => 'sample.pdf',
                    'receipt_uploaded_at' => now()->toIso8601String(),
                    'receipt_uploaded_by_user_id' => 1,
                    'remarks' => fake()->sentence(),
                    'submitted_at' => now()->toIso8601String(),
                    'verified_at' => null,
                    'verified_by_user_id' => null,
                    'total_quantity' => 3,
                    'total_amount' => '2400.00',
                ],
                'line_items' => [
                    [
                        'fee_category_id' => 1,
                        'category_name' => 'Regular',
                        'quantity' => 3,
                        'unit_amount' => '800.00',
                        'subtotal_amount' => '2400.00',
                    ],
                ],
            ],
            'altered_at' => now(),
        ];
    }
}
