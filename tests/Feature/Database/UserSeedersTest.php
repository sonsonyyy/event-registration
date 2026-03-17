<?php

use App\Models\Department;
use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

test('database seeder creates demo users for each role', function () {
    $this->seed(DatabaseSeeder::class);

    $adminUsers = User::query()
        ->whereIn('email', [
            'wcpeligrino6@gmail.com',
            'jeromeoliveros65@gmail.com',
            'salangsangerickson@gmail.com',
        ])
        ->orderBy('email')
        ->get();

    $managerUsers = User::query()
        ->whereIn('email', [
            'insojeff31@gmail.com',
            'elmor.tenorio@gmail.com',
            'johndiamante8@gmail.com',
            'ptrjunartongol@gmail.com',
        ])
        ->orderBy('email')
        ->get();

    expect($adminUsers)->toHaveCount(3)
        ->and($managerUsers)->toHaveCount(4)
        ->and(User::query()->count())->toBe(7);

    $adminUsers->each(function (User $admin): void {
        expect($admin)
            ->and($admin->roleName())->toBe(Role::ADMIN)
            ->and($admin->isActive())->toBeTrue()
            ->and($admin->district?->name)->toBe('Central Luzon')
            ->and($admin->section?->name)->toBe('Section 3')
            ->and($admin->department_id)->toBeNull()
            ->and($admin->pastor_id)->toBeNull();
    });

    expect($managerUsers->pluck('section.name', 'email')->all())
        ->toBe([
            'elmor.tenorio@gmail.com' => 'Section 2',
            'insojeff31@gmail.com' => 'Section 1',
            'johndiamante8@gmail.com' => 'Section 2',
            'ptrjunartongol@gmail.com' => 'Section 3',
        ]);

    $managerUsers->each(function (User $manager): void {
        expect($manager)
            ->and($manager->roleName())->toBe(Role::MANAGER)
            ->and($manager->isActive())->toBeTrue()
            ->and($manager->district?->name)->toBe('Central Luzon')
            ->and($manager->department_id)->toBeNull()
            ->and($manager->pastor_id)->toBeNull();
    });

    expect(User::query()->whereIn('email', [
        'admin@example.com',
        'manager@example.com',
        'staff@example.com',
        'registrant@example.com',
    ])->exists())->toBeFalse();

    expect(District::query()->count())->toBe(1)
        ->and(Department::query()->count())->toBe(6)
        ->and(Section::query()->count())->toBe(3)
        ->and(Pastor::query()->count())->toBe(221);

    expect(Department::query()->orderBy('name')->pluck('name')->all())
        ->toEqualCanonicalizing([
            'Youth Ministries',
            'Ladies Ministries',
            "Apostolic Men's",
            'Sunday School',
            'Home Missions',
            'Music Commission',
        ]);

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

    $sectionOne = Section::query()
        ->where('name', 'Section 1')
        ->withCount('pastors')
        ->firstOrFail();
    $sectionTwo = Section::query()
        ->where('name', 'Section 2')
        ->withCount('pastors')
        ->firstOrFail();
    $sectionThree = Section::query()
        ->where('name', 'Section 3')
        ->withCount('pastors')
        ->firstOrFail();

    expect($sectionOne->pastors_count)->toBe(63)
        ->and($sectionTwo->pastors_count)->toBe(64)
        ->and($sectionThree->pastors_count)->toBe(94);

    expect(Pastor::query()
        ->where('section_id', $sectionOne->id)
        ->where('church_name', 'UPC')
        ->where('pastor_name', 'Boy Ichi Campana')
        ->exists())->toBeTrue()
        ->and(Pastor::query()
            ->where('section_id', $sectionOne->id)
            ->where('church_name', 'UPC')
            ->where('pastor_name', 'Angelo Acosta')
            ->exists())->toBeTrue()
        ->and(Pastor::query()
            ->where('section_id', $sectionTwo->id)
            ->where('church_name', 'UPC')
            ->where('pastor_name', 'Rodolfo Dela Rosa')
            ->exists())->toBeTrue()
        ->and(Pastor::query()
            ->where('section_id', $sectionTwo->id)
            ->where('church_name', 'UPC')
            ->where('pastor_name', 'Joseph Gonzales')
            ->exists())->toBeTrue()
        ->and(Pastor::query()
            ->where('section_id', $sectionThree->id)
            ->where('church_name', 'UPC')
            ->where('pastor_name', 'Francis Alim')
            ->exists())->toBeTrue()
        ->and(Pastor::query()
            ->where('section_id', $sectionThree->id)
            ->where('church_name', 'UPC')
            ->where('pastor_name', 'Charlie Zaspa')
            ->exists())->toBeTrue();
});
