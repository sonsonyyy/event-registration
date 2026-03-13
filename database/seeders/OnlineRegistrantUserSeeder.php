<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Seeder;

class OnlineRegistrantUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $onlineRegistrantRole = Role::query()->firstOrCreate([
            'name' => Role::ONLINE_REGISTRANT,
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
                'description' => 'Seeded section shared by demo scoped users.',
                'status' => 'active',
            ],
        );

        $pastor = Pastor::query()->updateOrCreate(
            [
                'section_id' => $section->id,
                'church_name' => 'Grace Community Church',
            ],
            [
                'pastor_name' => 'Pastor Jane Doe',
                'contact_number' => '+63 912 345 6789',
                'email' => 'grace@example.com',
                'address' => '123 Church Street',
                'status' => 'active',
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'registrant@example.com'],
            [
                'name' => 'Online Registrant',
                'password' => 'password',
                'role_id' => $onlineRegistrantRole->id,
                'district_id' => $district->id,
                'section_id' => $section->id,
                'pastor_id' => $pastor->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ],
        );
    }
}
