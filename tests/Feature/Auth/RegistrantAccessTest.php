<?php

use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests can submit self-service registrant account requests', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $section = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $pastor = Pastor::factory()->for($section)->create([
        'pastor_name' => 'Pastor Jane Doe',
        'church_name' => 'Grace Community Church',
    ]);

    $this->get(route('registrant-access.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/registrant-access')
            ->has('sections', 1)
            ->has('pastors', 1)
            ->where('pastors.0.church_name', 'Grace Community Church'));

    $this->post(route('registrant-access.store'), [
        'name' => 'Church Representative',
        'email' => 'representative@example.com',
        'section_id' => $section->id,
        'pastor_id' => $pastor->id,
        'password' => 'password',
        'password_confirmation' => 'password',
    ])
        ->assertRedirect(route('login'))
        ->assertSessionHas('status', 'registrant-access-submitted');

    $requestUser = User::query()
        ->with('role')
        ->where('email', 'representative@example.com')
        ->firstOrFail();

    expect($requestUser->roleName())->toBe(Role::ONLINE_REGISTRANT)
        ->and($requestUser->district_id)->toBe($district->id)
        ->and($requestUser->section_id)->toBe($section->id)
        ->and($requestUser->pastor_id)->toBe($pastor->id)
        ->and($requestUser->status)->toBe(User::STATUS_ACTIVE)
        ->and($requestUser->approval_status)->toBe(User::APPROVAL_PENDING)
        ->and($requestUser->account_source)->toBe(User::ACCOUNT_SOURCE_SELF_SERVICE)
        ->and($requestUser->email_verified_at)->not->toBeNull();

    $this->actingAs($requestUser)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('auth.can.manageOnlineRegistrations', false)
            ->where('dashboard.account_notice.status', User::APPROVAL_PENDING));

    $this->actingAs($requestUser)
        ->get(route('registrations.online.index'))
        ->assertForbidden();
});

test('self-service requests cannot be created when a church already has an active registrant account', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $pastor = Pastor::factory()->for($section)->create();

    User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $pastor->id,
    ]);

    $this->from(route('registrant-access.create'))
        ->post(route('registrant-access.store'), [
            'name' => 'Duplicate Representative',
            'email' => 'duplicate@example.com',
            'section_id' => $section->id,
            'pastor_id' => $pastor->id,
            'password' => 'password',
            'password_confirmation' => 'password',
        ])
        ->assertRedirect(route('registrant-access.create'))
        ->assertSessionHasErrors(['pastor_id']);
});

test('self-service requests require an email address with a top-level domain', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $pastor = Pastor::factory()->for($section)->create();

    $this->from(route('registrant-access.create'))
        ->post(route('registrant-access.store'), [
            'name' => 'Church Representative',
            'email' => 'representative@example',
            'section_id' => $section->id,
            'pastor_id' => $pastor->id,
            'password' => 'password',
            'password_confirmation' => 'password',
        ])
        ->assertRedirect(route('registrant-access.create'))
        ->assertSessionHasErrors(['email']);
});
