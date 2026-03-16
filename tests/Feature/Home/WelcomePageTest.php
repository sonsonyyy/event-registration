<?php

use App\Models\Event;
use App\Models\EventFeeCategory;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('welcome page lists open events that can still accept registrations', function () {
    $registrationCloseAt = Carbon::create(2026, 4, 12, 23, 59, 59, config('app.timezone'));

    $availableEvent = Event::factory()->create([
        'name' => 'CLD Youth Conference 2026',
        'status' => Event::STATUS_OPEN,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => $registrationCloseAt,
        'total_capacity' => 800,
    ]);
    EventFeeCategory::factory()->for($availableEvent)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
        'status' => 'active',
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
            ->where('events.0.fee_categories.0.category_name', 'Regular (Online)'));

    expect(config('app.timezone'))->toBe('Asia/Manila');
});
