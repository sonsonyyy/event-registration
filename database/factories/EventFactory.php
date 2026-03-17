<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $eventStart = fake()->dateTimeBetween('+1 week', '+2 months');
        $eventEnd = (clone $eventStart)->modify('+2 days');
        $registrationOpenAt = (clone $eventStart)->modify('-14 days');
        $registrationCloseAt = (clone $eventStart)->modify('-1 day');

        return [
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'date_from' => $eventStart,
            'date_to' => $eventEnd,
            'venue' => sprintf('%s Hall', fake()->company()),
            'registration_open_at' => $registrationOpenAt,
            'registration_close_at' => $registrationCloseAt,
            'total_capacity' => fake()->numberBetween(100, 1000),
            'status' => Event::STATUS_DRAFT,
            'scope_type' => Event::SCOPE_DISTRICT,
            'section_id' => null,
            'department_id' => null,
        ];
    }
}
