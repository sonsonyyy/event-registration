<?php

use App\Models\District;
use App\Models\Pastor;
use App\Models\Section;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can review self-service registrant account requests', function () {
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $section = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $pastor = Pastor::factory()->for($section)->create([
        'church_name' => 'Grace Community Church',
    ]);
    $otherPastor = Pastor::factory()->for($section)->create([
        'church_name' => 'Bethel Community Church',
    ]);
    $pendingRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $district->id,
            'section_id' => $section->id,
            'pastor_id' => $pastor->id,
            'email' => 'request@example.com',
        ]);

    User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $pastor->id,
        'email' => 'existing@example.com',
    ]);

    User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $otherPastor->id,
        'email' => 'admin-created@example.com',
    ]);

    $this->actingAs($admin)
        ->get(route('account-requests.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('account-requests/index')
            ->where('scopeSummary', 'all sections')
            ->where('filters.status', User::APPROVAL_PENDING)
            ->where('summary.pending', 1)
            ->where('summary.approved', 0)
            ->has('requests.data', 1)
            ->where('requests.data.0.email', 'request@example.com'));

    $this->actingAs($admin)
        ->patch(route('account-requests.update', $pendingRequest), [
            'decision' => User::APPROVAL_APPROVED,
        ])
        ->assertRedirect();

    $pendingRequest->refresh();

    expect($pendingRequest->approval_status)->toBe(User::APPROVAL_APPROVED)
        ->and($pendingRequest->approval_reviewed_by_user_id)->toBe($admin->id)
        ->and($pendingRequest->approval_reviewed_at)->not->toBeNull();

    $this->actingAs($pendingRequest)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.can.manageOnlineRegistrations', true)
            ->where('dashboard.account_notice', null));
});

test('managers can only review self-service registrant requests within their assigned section', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $section = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $otherSection = Section::factory()->for($district)->create([
        'name' => 'Section 2',
    ]);
    $scopedPastor = Pastor::factory()->for($section)->create([
        'church_name' => 'Grace Community Church',
    ]);
    $outsidePastor = Pastor::factory()->for($otherSection)->create([
        'church_name' => 'Faith Community Church',
    ]);
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);
    $scopedRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $district->id,
            'section_id' => $section->id,
            'pastor_id' => $scopedPastor->id,
            'email' => 'section1@example.com',
        ]);
    $outsideRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $district->id,
            'section_id' => $otherSection->id,
            'pastor_id' => $outsidePastor->id,
            'email' => 'section2@example.com',
        ]);

    $this->actingAs($manager)
        ->get(route('account-requests.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('account-requests/index')
            ->where('scopeSummary', 'Central Luzon • Section 1')
            ->where('summary.pending', 1)
            ->has('requests.data', 1)
            ->where('requests.data.0.email', 'section1@example.com'));

    $this->actingAs($manager)
        ->patch(route('account-requests.update', $scopedRequest), [
            'decision' => User::APPROVAL_APPROVED,
        ])
        ->assertRedirect();

    $this->actingAs($manager)
        ->patch(route('account-requests.update', $outsideRequest), [
            'decision' => User::APPROVAL_APPROVED,
        ])
        ->assertForbidden();
});

test('admins cannot approve a third registrant account for the same church', function () {
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $pastor = Pastor::factory()->for($section)->create();
    $pendingRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $district->id,
            'section_id' => $section->id,
            'pastor_id' => $pastor->id,
        ]);

    User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $pastor->id,
        'email' => 'first@example.com',
    ]);

    User::factory()->onlineRegistrant()->pendingApproval()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $pastor->id,
        'email' => 'second@example.com',
    ]);

    $this->actingAs($admin)
        ->from(route('account-requests.index'))
        ->patch(route('account-requests.update', $pendingRequest), [
            'decision' => User::APPROVAL_APPROVED,
        ])
        ->assertRedirect(route('account-requests.index'))
        ->assertSessionHasErrors(['decision']);

    expect($pendingRequest->refresh()->approval_status)->toBe(User::APPROVAL_PENDING);
});
