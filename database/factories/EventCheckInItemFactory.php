<?php

namespace Database\Factories;

use App\Models\EventCheckIn;
use App\Models\EventCheckInItem;
use App\Models\EventFeeCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EventCheckInItem>
 */
class EventCheckInItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_check_in_id' => EventCheckIn::factory(),
            'fee_category_id' => EventFeeCategory::factory(),
            'quantity_claimed' => fake()->numberBetween(1, 10),
            'remarks' => fake()->sentence(),
        ];
    }
}
