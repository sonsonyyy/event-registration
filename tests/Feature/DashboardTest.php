<?php

use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\Section;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('dashboard.hero')
            ->has('dashboard.links')
            ->has('dashboard.scope')
            ->has('dashboard.metrics', 4)
            ->has('dashboard.open_events')
            ->has('dashboard.recent_registrations'));
});

test('manager dashboard is limited to the assigned section scope', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $section = Section::factory()->create([
        'district_id' => $district->id,
        'name' => 'Section 1',
    ]);
    $otherSection = Section::factory()->create([
        'district_id' => $district->id,
        'name' => 'Section 2',
    ]);
    $scopedPastor = Pastor::factory()->create([
        'section_id' => $section->id,
        'church_name' => 'Grace Community Church',
    ]);
    $otherPastor = Pastor::factory()->create([
        'section_id' => $otherSection->id,
    ]);
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);
    $event = createDashboardEvent();
    $scopedRegistration = Registration::factory()->create([
        'event_id' => $event->id,
        'pastor_id' => $scopedPastor->id,
        'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
    ]);
    Registration::factory()->create([
        'event_id' => $event->id,
        'pastor_id' => $otherPastor->id,
        'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
    ]);

    $this->actingAs($manager);

    $response = $this->get(route('dashboard'));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('dashboard.scope.summary', 'Section 1, Central Luzon')
        ->where('dashboard.links.open_events.href', route('registrations.onsite.create', absolute: false))
        ->where('dashboard.links.recent_activity.href', route('registrations.onsite.index', absolute: false))
        ->where('dashboard.metrics.0.value', 1)
        ->where('dashboard.metrics.1.value', 1)
        ->where('dashboard.metrics.2.value', 1)
        ->where('dashboard.metrics.3.value', 1)
        ->has('dashboard.recent_registrations', 1)
        ->where('dashboard.recent_registrations.0.id', $scopedRegistration->id)
        ->where('dashboard.open_events.0.id', $event->id));
});

test('online registrant dashboard is limited to the assigned church scope', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $section = Section::factory()->create([
        'district_id' => $district->id,
        'name' => 'Section 1',
    ]);
    $scopedPastor = Pastor::factory()->create([
        'section_id' => $section->id,
        'church_name' => 'Grace Community Church',
        'pastor_name' => 'Pastor Jane Doe',
    ]);
    $otherPastor = Pastor::factory()->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $scopedPastor->id,
    ]);
    $event = createDashboardEvent();
    $scopedRegistration = Registration::factory()->create([
        'event_id' => $event->id,
        'pastor_id' => $scopedPastor->id,
        'registration_mode' => Registration::MODE_ONLINE,
        'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
    ]);
    Registration::factory()->create([
        'event_id' => $event->id,
        'pastor_id' => $otherPastor->id,
        'registration_mode' => Registration::MODE_ONLINE,
        'registration_status' => Registration::STATUS_VERIFIED,
    ]);

    $this->actingAs($registrant);

    $response = $this->get(route('dashboard'));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('dashboard.scope.summary', 'Grace Community Church')
        ->where('dashboard.links.open_events.href', route('registrations.online.create', absolute: false))
        ->where('dashboard.links.recent_activity.href', route('registrations.online.index', absolute: false))
        ->where('dashboard.metrics.0.value', 1)
        ->where('dashboard.metrics.1.value', 1)
        ->where('dashboard.metrics.2.value', 1)
        ->where('dashboard.metrics.3.value', 0)
        ->has('dashboard.recent_registrations', 1)
        ->where('dashboard.recent_registrations.0.id', $scopedRegistration->id)
        ->where('dashboard.open_events.0.id', $event->id));
});

test('pending online registrants see an approval notice and no online registration access flag', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $section = Section::factory()->create([
        'district_id' => $district->id,
        'name' => 'Section 1',
    ]);
    $pastor = Pastor::factory()->create([
        'section_id' => $section->id,
        'church_name' => 'Grace Community Church',
        'pastor_name' => 'Pastor Jane Doe',
    ]);
    $registrant = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $district->id,
            'section_id' => $section->id,
            'pastor_id' => $pastor->id,
        ]);

    $this->actingAs($registrant)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('auth.can.manageOnlineRegistrations', false)
            ->where('dashboard.account_notice.status', User::APPROVAL_PENDING)
            ->where('dashboard.links.open_events.href', route('dashboard', absolute: false))
            ->where('dashboard.links.recent_activity.href', route('dashboard', absolute: false)));
});

function createDashboardEvent(): Event
{
    $event = Event::factory()->create([
        'name' => 'CLD Youth Conference 2026',
        'status' => Event::STATUS_OPEN,
        'date_from' => now()->addMonth(),
        'date_to' => now()->addMonth()->addDay(),
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(10),
        'total_capacity' => 500,
    ]);

    EventFeeCategory::factory()->create([
        'event_id' => $event->id,
        'status' => 'active',
    ]);

    return $event;
}
