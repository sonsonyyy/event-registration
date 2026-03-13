<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $adminRole = Role::query()->firstOrCreate([
            'name' => Role::ADMIN,
        ]);

        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'System Admin',
                'password' => 'password',
                'role_id' => $adminRole->id,
                'district_id' => null,
                'section_id' => null,
                'pastor_id' => null,
                'status' => 'active',
                'email_verified_at' => now(),
            ],
        );
    }
}
