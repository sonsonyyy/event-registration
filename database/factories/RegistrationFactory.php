<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Registration>
 */
class RegistrationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'pastor_id' => Pastor::factory(),
            'encoded_by_user_id' => User::factory(),
            'registration_mode' => 'onsite',
            'payment_status' => 'unpaid',
            'registration_status' => 'draft',
            'payment_reference' => null,
            'receipt_file_path' => null,
            'receipt_original_name' => null,
            'receipt_uploaded_at' => null,
            'receipt_uploaded_by_user_id' => null,
            'remarks' => fake()->sentence(),
            'submitted_at' => now(),
            'verified_at' => null,
            'verified_by_user_id' => null,
        ];
    }
}
