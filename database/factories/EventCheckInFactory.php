<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\EventCheckIn;
use App\Models\Pastor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EventCheckIn>
 */
class EventCheckInFactory extends Factory
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
            'checked_in_by_user_id' => User::factory(),
            'representative_name' => fake()->name(),
            'total_claimed_quantity' => fake()->numberBetween(1, 10),
            'remarks' => fake()->sentence(),
            'checked_in_at' => now(),
        ];
    }
}
