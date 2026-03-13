<?php

use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

test('database seeder creates demo users for each role', function () {
    $this->seed(DatabaseSeeder::class);

    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $manager = User::query()->where('email', 'manager@example.com')->firstOrFail();
    $registrationStaff = User::query()->where('email', 'staff@example.com')->firstOrFail();
    $onlineRegistrant = User::query()->where('email', 'registrant@example.com')->firstOrFail();

    expect($admin)
        ->and($admin->roleName())->toBe(Role::ADMIN)
        ->and($admin->isActive())->toBeTrue()
        ->and($admin->section_id)->toBeNull()
        ->and($admin->pastor_id)->toBeNull();

    expect($manager)
        ->and($manager->roleName())->toBe(Role::MANAGER)
        ->and($manager->isActive())->toBeTrue()
        ->and($manager->district?->name)->toBe('Central Luzon')
        ->and($manager->section?->name)->toBe('Section 1');

    expect($registrationStaff)
        ->and($registrationStaff->roleName())->toBe(Role::REGISTRATION_STAFF)
        ->and($registrationStaff->isActive())->toBeTrue()
        ->and($registrationStaff->section_id)->toBeNull()
        ->and($registrationStaff->pastor_id)->toBeNull();

    expect($onlineRegistrant)
        ->and($onlineRegistrant->roleName())->toBe(Role::ONLINE_REGISTRANT)
        ->and($onlineRegistrant->isActive())->toBeTrue()
        ->and($onlineRegistrant->pastor?->church_name)->toBe('Grace Community Church')
        ->and($onlineRegistrant->district?->name)->toBe('Central Luzon')
        ->and($onlineRegistrant->section?->name)->toBe('Section 1');

    expect(District::query()->count())->toBe(1)
        ->and(Section::query()->count())->toBe(3)
        ->and(Pastor::query()->count())->toBe(6);

    expect(District::query()->orderBy('name')->pluck('name')->all())
        ->toBe([
            'Central Luzon',
        ]);

    District::query()
        ->with(['sections' => fn ($query) => $query->orderBy('name')])
        ->withCount('sections')
        ->get()
        ->each(function (District $district): void {
            expect($district->sections_count)->toBe(3);
            expect($district->sections->pluck('name')->all())->toBe([
                'Section 1',
                'Section 2',
                'Section 3',
            ]);
        });

    Section::query()
        ->withCount('pastors')
        ->get()
        ->each(function (Section $section): void {
            expect($section->pastors_count)->toBe(2);
        });
});
