<?php

use App\Models\Department;
use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('profile page is displayed', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $section = Section::factory()->for($district)->create([
        'name' => 'Section 3',
    ]);
    $department = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $pastor = Pastor::factory()->for($section)->create([
        'church_name' => 'UPC',
        'pastor_name' => 'Erickson Salangsang',
    ]);
    $user = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'department_id' => $department->id,
        'pastor_id' => $pastor->id,
        'position_title' => 'Secretary',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/profile')
            ->has('mustVerifyEmail')
            ->where('account.role_name', Role::MANAGER)
            ->where('account.position_title', 'Secretary')
            ->where('account.department_name', 'Youth Ministries')
            ->where('account.district_name', 'Central Luzon')
            ->where('account.section_name', 'Section 3')
            ->where('account.church_name', 'UPC')
            ->where('account.pastor_name', 'Erickson Salangsang')
            ->where('account.status_label', 'Active'));
});

test('profile information cannot be updated by the user from settings', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patch('/settings/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ])
        ->assertMethodNotAllowed();

    $user->refresh();

    expect($user->name)->not->toBe('Test User');
    expect($user->email)->not->toBe('test@example.com');
});

test('users cannot delete their own account from settings', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->delete('/settings/profile', [
            'password' => 'password',
        ])
        ->assertMethodNotAllowed();

    expect($user->fresh())->not->toBeNull();
});
