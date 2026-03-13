<?php

namespace Database\Factories;

use App\Models\EventFeeCategory;
use App\Models\Registration;
use App\Models\RegistrationItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RegistrationItem>
 */
class RegistrationItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 20);
        $unitAmount = fake()->randomFloat(2, 100, 1000);

        return [
            'registration_id' => Registration::factory(),
            'fee_category_id' => EventFeeCategory::factory(),
            'quantity' => $quantity,
            'unit_amount' => $unitAmount,
            'subtotal_amount' => $quantity * $unitAmount,
            'remarks' => fake()->sentence(),
        ];
    }
}
