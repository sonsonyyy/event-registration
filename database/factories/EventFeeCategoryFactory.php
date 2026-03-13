<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\EventFeeCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EventFeeCategory>
 */
class EventFeeCategoryFactory extends Factory
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
            'category_name' => fake()->unique()->words(2, true),
            'amount' => fake()->randomFloat(2, 100, 1500),
            'slot_limit' => null,
            'status' => 'active',
        ];
    }
}
