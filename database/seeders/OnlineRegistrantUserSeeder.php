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
        $this->call([
            RoleSeeder::class,
            PastorRosterSeeder::class,
        ]);

        $onlineRegistrantRole = Role::query()->firstOrCreate([
            'name' => Role::ONLINE_REGISTRANT,
        ]);

        $district = District::query()
            ->where('name', 'Central Luzon')
            ->firstOrFail();

        $section = Section::query()
            ->where('district_id', $district->id)
            ->where('name', 'Section 2')
            ->firstOrFail();

        $pastor = Pastor::query()
            ->where('section_id', $section->id)
            ->where('pastor_name', 'Rodolfo Dela Rosa')
            ->firstOrFail();

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
