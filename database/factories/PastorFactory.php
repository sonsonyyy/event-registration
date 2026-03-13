<?php

namespace Database\Factories;

use App\Models\Pastor;
use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pastor>
 */
class PastorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'section_id' => Section::factory(),
            'pastor_name' => fake()->name(),
            'church_name' => sprintf('%s Church', fake()->unique()->company()),
            'contact_number' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'address' => fake()->address(),
            'status' => 'active',
        ];
    }
}
