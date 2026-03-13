<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role_id' => fn () => Role::query()->firstOrCreate([
                'name' => Role::ONLINE_REGISTRANT,
            ])->id,
            'district_id' => null,
            'section_id' => null,
            'pastor_id' => null,
            'status' => 'active',
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function withRole(string $role): static
    {
        return $this->state(fn (array $attributes) => [
            'role_id' => fn () => Role::query()->firstOrCreate([
                'name' => $role,
            ])->id,
        ]);
    }

    public function admin(): static
    {
        return $this->withRole(Role::ADMIN);
    }

    public function manager(): static
    {
        return $this->withRole(Role::MANAGER);
    }

    public function registrationStaff(): static
    {
        return $this->withRole(Role::REGISTRATION_STAFF);
    }

    public function onlineRegistrant(): static
    {
        return $this->withRole(Role::ONLINE_REGISTRANT);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
