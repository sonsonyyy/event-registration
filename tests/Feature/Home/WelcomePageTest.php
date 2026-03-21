<?php

use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('authenticated users are redirected away from the welcome page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('home'))
        ->assertRedirect(route('dashboard'));
});

test('development banner is displayed outside production', function () {
    config()->set('app.env', 'local');

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertSeeText('Development Environment');
});

test('environment banner is hidden in production', function () {
    config()->set('app.env', 'production');

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertDontSeeText('Development Environment')
        ->assertDontSeeText('Staging Environment');
});

test('welcome page lists open events that can still accept registrations', function () {
    config()->set('app.asset_url', 'http://assets.test');

    $registrationCloseAt = Carbon::create(2026, 4, 12, 23, 59, 59, config('app.timezone'));

    $availableEvent = Event::factory()->create([
        'name' => 'CLD Youth Conference 2026',
        'status' => Event::STATUS_OPEN,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => $registrationCloseAt,
        'total_capacity' => 800,
    ]);
    $availableFeeCategory = EventFeeCategory::factory()->for($availableEvent)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
        'slot_limit' => 10,
        'status' => 'active',
    ]);
    $reservedRegistration = Registration::factory()->create([
        'event_id' => $availableEvent->id,
        'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
    ]);
    RegistrationItem::factory()->create([
        'registration_id' => $reservedRegistration->id,
        'fee_category_id' => $availableFeeCategory->id,
        'quantity' => 3,
        'unit_amount' => '800.00',
        'subtotal_amount' => 2400,
    ]);
    $rejectedRegistration = Registration::factory()->create([
        'event_id' => $availableEvent->id,
        'registration_status' => Registration::STATUS_REJECTED,
    ]);
    RegistrationItem::factory()->create([
        'registration_id' => $rejectedRegistration->id,
        'fee_category_id' => $availableFeeCategory->id,
        'quantity' => 2,
        'unit_amount' => '800.00',
        'subtotal_amount' => 1600,
    ]);

    $closedWindowEvent = Event::factory()->create([
        'name' => 'Expired Registration Event',
        'status' => Event::STATUS_OPEN,
        'registration_open_at' => now()->subWeeks(2),
        'registration_close_at' => now()->subDay(),
    ]);
    EventFeeCategory::factory()->for($closedWindowEvent)->create([
        'category_name' => 'Regular',
        'status' => 'active',
    ]);

    $draftEvent = Event::factory()->create([
        'name' => 'Draft Event',
        'status' => Event::STATUS_DRAFT,
    ]);
    EventFeeCategory::factory()->for($draftEvent)->create([
        'category_name' => 'Draft Category',
        'status' => 'active',
    ]);

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('events', 1)
            ->has('registrationFlow', 5)
            ->has('faqs', 5)
            ->where('registrationFlow.0.title', 'Request a registrant account')
            ->where('faqs.0.question', 'How do I request a registrant account for our church?')
            ->where('events.0.name', 'CLD Youth Conference 2026')
            ->where('events.0.registration_close_at', $registrationCloseAt->toIso8601String())
            ->where('events.0.remaining_slots', 797)
            ->where('events.0.fee_categories.0.remaining_slots', 7)
            ->where('events.0.fee_categories.0.category_name', 'Regular (Online)'));

    $laterReservation = Registration::factory()->create([
        'event_id' => $availableEvent->id,
        'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
    ]);
    RegistrationItem::factory()->create([
        'registration_id' => $laterReservation->id,
        'fee_category_id' => $availableFeeCategory->id,
        'quantity' => 2,
        'unit_amount' => '800.00',
        'subtotal_amount' => 1600,
    ]);

    $this->get(route('home'), [
        'X-Inertia' => 'true',
        'X-Inertia-Partial-Component' => 'welcome',
        'X-Inertia-Partial-Data' => 'events',
        'X-Inertia-Version' => hash('xxh128', (string) config('app.asset_url')),
        'X-Requested-With' => 'XMLHttpRequest',
    ])
        ->assertSuccessful()
        ->assertJsonPath('props.events.0.remaining_slots', 795)
        ->assertJsonPath('props.events.0.fee_categories.0.remaining_slots', 5)
        ->assertJsonMissingPath('props.registrationFlow')
        ->assertJsonMissingPath('props.faqs');

    expect(config('app.timezone'))->toBe('Asia/Manila');
});
