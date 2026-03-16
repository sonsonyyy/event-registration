<?php

namespace Database\Factories;

use App\Models\Registration;
use App\Models\RegistrationReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RegistrationReview>
 */
class RegistrationReviewFactory extends Factory
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
            'reviewer_user_id' => User::factory(),
            'decision' => Registration::STATUS_NEEDS_CORRECTION,
            'reason' => fake()->sentence(),
            'notes' => fake()->optional()->sentence(),
            'decided_at' => now(),
        ];
    }
}
