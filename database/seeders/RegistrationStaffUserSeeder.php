<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RegistrationStaffUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $registrationStaffRole = Role::query()->firstOrCreate([
            'name' => Role::REGISTRATION_STAFF,
        ]);

        User::query()->updateOrCreate(
            ['email' => 'staff@example.com'],
            [
                'name' => 'Registration Staff',
                'password' => 'password',
                'role_id' => $registrationStaffRole->id,
                'district_id' => null,
                'section_id' => null,
                'pastor_id' => null,
                'status' => 'active',
                'email_verified_at' => now(),
            ],
        );
    }
}
