<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Seeder;

class ManagerUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $managerRole = Role::query()->firstOrCreate([
            'name' => Role::MANAGER,
        ]);

        $district = District::query()->updateOrCreate(
            ['name' => 'Demo District'],
            [
                'description' => 'Seeded district for role-based UI testing.',
                'status' => 'active',
            ],
        );

        $section = Section::query()->updateOrCreate(
            [
                'district_id' => $district->id,
                'name' => 'North Section',
            ],
            [
                'description' => 'Seeded section assigned to the manager demo user.',
                'status' => 'active',
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Section Manager',
                'password' => 'password',
                'role_id' => $managerRole->id,
                'district_id' => $district->id,
                'section_id' => $section->id,
                'pastor_id' => null,
                'status' => 'active',
                'email_verified_at' => now(),
            ],
        );
    }
}
