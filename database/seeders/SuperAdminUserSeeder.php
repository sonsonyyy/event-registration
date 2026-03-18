<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $superAdminRole = Role::query()->firstOrCreate([
            'name' => Role::SUPER_ADMIN,
        ]);

        User::query()->updateOrCreate(
            ['email' => 'salangsangerickson@gmail.com'],
            [
                'name' => 'Erickson Salangsang',
                'password' => 'password',
                'role_id' => $superAdminRole->id,
                'district_id' => null,
                'section_id' => null,
                'department_id' => null,
                'pastor_id' => null,
                'position_title' => null,
                'status' => 'active',
                'email_verified_at' => now(),
            ],
        );
    }
}
