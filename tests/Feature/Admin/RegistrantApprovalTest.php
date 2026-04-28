<?php

use App\Models\Department;
use App\Models\District;
use App\Models\Pastor;
use App\Models\Section;
use App\Models\User;
use App\Notifications\RegistrantAccessApproved;
use App\Notifications\RegistrantAccessRejected;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

test('super admins can review self-service registrant account requests', function () {
    Notification::fake();

    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $department = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $superAdmin = User::factory()->superAdmin()->create();
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

    $this->actingAs($superAdmin)
        ->get(route('account-requests.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('account-requests/index')
            ->where('scopeSummary', 'all districts')
            ->where('filters.status', 'all')
            ->where('summary.pending', 1)
            ->where('summary.approved', 0)
            ->has('requests.data', 1)
            ->where('requests.data.0.email', 'request@example.com'));

    $this->actingAs($superAdmin)
        ->patch(route('account-requests.update', $pendingRequest), [
            'decision' => User::APPROVAL_APPROVED,
        ])
        ->assertRedirect();

    $pendingRequest->refresh();

    expect($pendingRequest->approval_status)->toBe(User::APPROVAL_APPROVED)
        ->and($pendingRequest->approval_reviewed_by_user_id)->toBe($superAdmin->id)
        ->and($pendingRequest->approval_reviewed_at)->not->toBeNull();

    Notification::assertSentTo($pendingRequest, RegistrantAccessApproved::class);

    $this->actingAs($pendingRequest)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.can.manageOnlineRegistrations', true)
            ->where('dashboard.account_notice', null));
});

test('admins can review self-service registrant account requests within their district', function () {
    Notification::fake();

    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $otherDistrict = District::factory()->create([
        'name' => 'Northern Luzon',
    ]);
    $section = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $otherDistrictSection = Section::factory()->for($otherDistrict)->create([
        'name' => 'Section 9',
    ]);
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $scopedRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $district->id,
            'section_id' => $section->id,
            'pastor_id' => Pastor::factory()->for($section)->create()->id,
            'email' => 'section1@example.com',
        ]);
    $outsideRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $otherDistrict->id,
            'section_id' => $otherDistrictSection->id,
            'pastor_id' => Pastor::factory()->for($otherDistrictSection)->create()->id,
            'email' => 'section9@example.com',
        ]);

    $this->actingAs($admin)
        ->get(route('account-requests.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('account-requests/index')
            ->where('scopeSummary', 'Central Luzon • All sections')
            ->where('summary.pending', 1)
            ->has('requests.data', 1)
            ->where('requests.data.0.email', 'section1@example.com'));

    $this->actingAs($admin)
        ->patch(route('account-requests.update', $scopedRequest), [
            'decision' => User::APPROVAL_APPROVED,
        ])
        ->assertRedirect();

    expect($scopedRequest->refresh()->approval_status)->toBe(User::APPROVAL_APPROVED)
        ->and($scopedRequest->approval_reviewed_by_user_id)->toBe($admin->id)
        ->and($scopedRequest->approval_reviewed_at)->not->toBeNull();

    Notification::assertSentTo($scopedRequest, RegistrantAccessApproved::class);

    $this->actingAs($admin)
        ->patch(route('account-requests.update', $outsideRequest), [
            'decision' => User::APPROVAL_APPROVED,
        ])
        ->assertForbidden();
});

test('admins can filter account requests by section within their district', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $alphaSection = Section::factory()->for($district)->create([
        'name' => 'Alpha Section',
    ]);
    $betaSection = Section::factory()->for($district)->create([
        'name' => 'Beta Section',
    ]);
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $alphaPastor = Pastor::factory()->for($alphaSection)->create([
        'church_name' => 'Alpha Community Church',
    ]);
    $betaPastor = Pastor::factory()->for($betaSection)->create([
        'church_name' => 'Beta Gospel Church',
    ]);

    User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $district->id,
            'section_id' => $alphaSection->id,
            'pastor_id' => $alphaPastor->id,
            'email' => 'alpha-request@example.com',
        ]);

    User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $district->id,
            'section_id' => $betaSection->id,
            'pastor_id' => $betaPastor->id,
            'email' => 'beta-pending@example.com',
        ]);

    User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->create([
            'district_id' => $district->id,
            'section_id' => $betaSection->id,
            'pastor_id' => $betaPastor->id,
            'approval_status' => User::APPROVAL_APPROVED,
            'approval_reviewed_by_user_id' => $admin->id,
            'approval_reviewed_at' => now()->subHour(),
            'email' => 'beta-approved@example.com',
        ]);

    $this->actingAs($admin)
        ->get(route('account-requests.index', [
            'section_id' => $betaSection->id,
            'status' => 'all',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('account-requests/index')
            ->where('filters.section_id', $betaSection->id)
            ->where('filters.status', 'all')
            ->has('sections', 2)
            ->where('sections.0.name', 'Alpha Section')
            ->where('sections.1.name', 'Beta Section')
            ->where('summary.pending', 1)
            ->where('summary.approved', 1)
            ->where('summary.rejected', 0)
            ->has('requests.data', 2)
            ->where('requests.data.0.pastor.section_name', 'Beta Section')
            ->where('requests.data.1.pastor.section_name', 'Beta Section')
            ->where('requests.meta.total', 2));
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
        'department_id' => Department::factory()->create([
            'name' => "Apostolic Men's",
        ])->id,
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

test('managers cannot approve a third registrant account for the same church', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);
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

    $this->actingAs($manager)
        ->from(route('account-requests.index'))
        ->patch(route('account-requests.update', $pendingRequest), [
            'decision' => User::APPROVAL_APPROVED,
        ])
        ->assertRedirect(route('account-requests.index'))
        ->assertSessionHasErrors(['decision']);

    expect($pendingRequest->refresh()->approval_status)->toBe(User::APPROVAL_PENDING);
});

test('reviewers notify registrants when requests are rejected', function () {
    Notification::fake();

    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);
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

    $this->actingAs($manager)
        ->patch(route('account-requests.update', $pendingRequest), [
            'decision' => User::APPROVAL_REJECTED,
        ])
        ->assertRedirect();

    Notification::assertSentTo($pendingRequest, RegistrantAccessRejected::class);
});
