<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => sprintf('Role %s', fake()->unique()->word()),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => Role::ADMIN,
        ]);
    }

    public function manager(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => Role::MANAGER,
        ]);
    }

    public function registrationStaff(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => Role::REGISTRATION_STAFF,
        ]);
    }

    public function onlineRegistrant(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => Role::ONLINE_REGISTRANT,
        ]);
    }
}
