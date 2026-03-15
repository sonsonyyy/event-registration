<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            DemoChurchHierarchySeeder::class,
        ]);

        $adminRole = Role::query()->firstOrCreate([
            'name' => Role::ADMIN,
        ]);

        User::query()
            ->whereIn('email', [
                'admin@example.com',
                'manager@example.com',
                'staff@example.com',
                'registrant@example.com',
            ])
            ->delete();

        $district = District::query()
            ->where('name', 'Central Luzon')
            ->firstOrFail();

        $section = Section::query()
            ->where('district_id', $district->id)
            ->where('name', 'Section 3')
            ->firstOrFail();

        foreach ($this->adminUsers() as $adminUser) {
            User::query()->updateOrCreate(
                ['email' => $adminUser['email']],
                [
                    'name' => $adminUser['name'],
                    'password' => 'password',
                    'role_id' => $adminRole->id,
                    'district_id' => $district->id,
                    'section_id' => $section->id,
                    'pastor_id' => null,
                    'status' => 'active',
                    'email_verified_at' => now(),
                ],
            );
        }
    }

    /**
     * @return array<int, array{name: string, email: string}>
     */
    private function adminUsers(): array
    {
        return [
            [
                'name' => 'Win Chester Peligrino',
                'email' => 'wcpeligrino6@gmail.com',
            ],
            [
                'name' => 'Jerome Oliveros',
                'email' => 'jeromeoliveros65@gmail.com',
            ],
            [
                'name' => 'Erickson Salangsang',
                'email' => 'salangsangerickson@gmail.com',
            ],
        ];
    }
}
