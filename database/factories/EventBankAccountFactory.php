<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\EventBankAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EventBankAccount>
 */
class EventBankAccountFactory extends Factory
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
            'bank_name' => fake()->company().' Bank',
            'account_name' => fake()->company(),
            'account_number' => fake()->numerify('##########'),
            'qr_code_path' => null,
            'qr_code_original_name' => null,
            'status' => EventBankAccount::STATUS_ACTIVE,
        ];
    }
}
