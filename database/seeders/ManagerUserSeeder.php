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
        $this->call([
            RoleSeeder::class,
            DemoChurchHierarchySeeder::class,
        ]);

        $managerRole = Role::query()->firstOrCreate([
            'name' => Role::MANAGER,
        ]);

        $district = District::query()
            ->where('name', 'Central Luzon')
            ->firstOrFail();

        foreach ($this->managerUsers() as $managerUser) {
            $section = Section::query()
                ->where('district_id', $district->id)
                ->where('name', $managerUser['section'])
                ->firstOrFail();

            User::query()->updateOrCreate(
                ['email' => $managerUser['email']],
                [
                    'name' => $managerUser['name'],
                    'password' => 'password',
                    'role_id' => $managerRole->id,
                    'district_id' => $district->id,
                    'section_id' => $section->id,
                    'department_id' => null,
                    'pastor_id' => null,
                    'position_title' => null,
                    'status' => 'active',
                    'email_verified_at' => now(),
                ],
            );
        }
    }

    /**
     * @return array<int, array{name: string, email: string, section: string}>
     */
    private function managerUsers(): array
    {
        return [
            [
                'name' => 'Jefhte Inso',
                'email' => 'insojeff31@gmail.com',
                'section' => 'Section 1',
            ],
            [
                'name' => 'Elmor Tenorio',
                'email' => 'elmor.tenorio@gmail.com',
                'section' => 'Section 2',
            ],
            [
                'name' => 'John Jeremiah Diamante',
                'email' => 'johndiamante8@gmail.com',
                'section' => 'Section 2',
            ],
            [
                'name' => 'Junar Tongol',
                'email' => 'ptrjunartongol@gmail.com',
                'section' => 'Section 3',
            ],
        ];
    }
}
