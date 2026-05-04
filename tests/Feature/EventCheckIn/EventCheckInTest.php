<?php

use App\Models\District;
use App\Models\Event;
use App\Models\EventCheckIn;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Section;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('registration staff can view event check-in progress and store partial claims', function () {
    $district = District::factory()->create([
        'name' => 'Central District',
    ]);
    $section = Section::factory()->for($district)->create([
        'name' => 'Central Section',
    ]);
    $pastor = Pastor::factory()->for($section)->create([
        'church_name' => 'Hope Assembly',
        'pastor_name' => 'Pastor James',
    ]);
    $staff = User::factory()->registrationStaff()->create([
        'district_id' => $district->id,
    ]);
    $event = eventCheckInEvent([
        'district_id' => $district->id,
        'name' => 'District Camp 2026',
    ]);
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular Kit',
        'amount' => '500.00',
    ]);
    $vip = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'VIP Kit',
        'amount' => '800.00',
    ]);

    createClaimableRegistration(
        $event,
        $pastor,
        $staff,
        $regular,
        5,
        Registration::MODE_ONLINE,
        Registration::STATUS_VERIFIED,
    );
    createClaimableRegistration(
        $event,
        $pastor,
        $staff,
        $vip,
        2,
        Registration::MODE_ONSITE,
        Registration::STATUS_COMPLETED,
    );
    createClaimableRegistration(
        $event,
        $pastor,
        $staff,
        $vip,
        4,
        Registration::MODE_ONLINE,
        Registration::STATUS_PENDING_VERIFICATION,
    );
    createCheckInClaim($event, $pastor, $staff, [
        $regular->id => 2,
    ]);

    $this->actingAs($staff)
        ->get(route('event-check-in.index', [
            'event_id' => $event->id,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('event-check-in/index')
            ->where('selectedEvent.date_from', '2026-05-05')
            ->where('selectedEvent.date_to', '2026-05-06')
            ->where('summary.registered_quantity', 7)
            ->where('summary.claimed_quantity', 2)
            ->where('summary.remaining_quantity', 5)
            ->has('feeCategorySummary', 2)
            ->where('feeCategorySummary.0.registered_quantity', 5)
            ->where('feeCategorySummary.0.claimed_quantity', 2)
            ->where('feeCategorySummary.0.remaining_quantity', 3)
            ->where('feeCategorySummary.1.registered_quantity', 2)
            ->where('feeCategorySummary.1.claimed_quantity', 0)
            ->where('feeCategorySummary.1.remaining_quantity', 2)
            ->has('churches.data', 1)
            ->where('churches.data.0.church_name', 'Hope Assembly')
            ->where('churches.data.0.registered_quantity', 7)
            ->where('churches.data.0.claimed_quantity', 2)
            ->where('churches.data.0.remaining_quantity', 5)
            ->where('churches.data.0.claim_status', 'partially claimed'));

    $this->actingAs($staff)
        ->post(route('event-check-in.store'), [
            'event_id' => $event->id,
            'pastor_id' => $pastor->id,
            'representative_name' => 'Sister Joy',
            'remarks' => 'Released at the main booth.',
            'line_items' => [
                [
                    'fee_category_id' => $regular->id,
                    'quantity_claimed' => 1,
                    'remarks' => '',
                ],
                [
                    'fee_category_id' => $vip->id,
                    'quantity_claimed' => 2,
                    'remarks' => 'VIP table pick-up',
                ],
            ],
            'current_filters' => [
                'section_id' => null,
                'search' => '',
                'claim_status' => 'all',
                'per_page' => 10,
            ],
        ])
        ->assertRedirect(route('event-check-in.index', [
            'event_id' => $event->id,
            'per_page' => 10,
        ]));

    $latestClaim = EventCheckIn::query()
        ->with('items')
        ->latest('id')
        ->firstOrFail();

    expect($latestClaim->representative_name)->toBe('Sister Joy')
        ->and($latestClaim->total_claimed_quantity)->toBe(3)
        ->and($latestClaim->items)->toHaveCount(2)
        ->and($latestClaim->items->firstWhere('fee_category_id', $regular->id)?->quantity_claimed)->toBe(1)
        ->and($latestClaim->items->firstWhere('fee_category_id', $vip->id)?->quantity_claimed)->toBe(2);

    $this->actingAs($staff)
        ->get(route('event-check-in.index', [
            'event_id' => $event->id,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('summary.claimed_quantity', 5)
            ->where('summary.remaining_quantity', 2)
            ->where('churches.data.0.claimed_quantity', 5)
            ->where('churches.data.0.remaining_quantity', 2));
});

test('event check-in rejects claims that exceed remaining quantity', function () {
    $pastor = Pastor::factory()->create();
    $staff = User::factory()->registrationStaff()->create([
        'district_id' => $pastor->section->district_id,
    ]);
    $event = eventCheckInEvent([
        'district_id' => $pastor->section->district_id,
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular Kit',
    ]);

    createClaimableRegistration(
        $event,
        $pastor,
        $staff,
        $feeCategory,
        3,
        Registration::MODE_ONLINE,
        Registration::STATUS_VERIFIED,
    );
    createCheckInClaim($event, $pastor, $staff, [
        $feeCategory->id => 2,
    ]);

    $this->actingAs($staff)
        ->from(route('event-check-in.index', [
            'event_id' => $event->id,
        ]))
        ->post(route('event-check-in.store'), [
            'event_id' => $event->id,
            'pastor_id' => $pastor->id,
            'representative_name' => 'Brother Mark',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity_claimed' => 2,
                    'remarks' => '',
                ],
            ],
            'current_filters' => [
                'section_id' => null,
                'search' => '',
                'claim_status' => 'all',
                'per_page' => 10,
            ],
        ])
        ->assertRedirect(route('event-check-in.index', [
            'event_id' => $event->id,
        ]))
        ->assertSessionHasErrors(['line_items.0.quantity_claimed']);

    expect(EventCheckIn::query()->count())->toBe(1);
});

test('event check-in exposes fully claimed churches once remaining quantity is exhausted', function () {
    $pastor = Pastor::factory()->create();
    $staff = User::factory()->registrationStaff()->create([
        'district_id' => $pastor->section->district_id,
    ]);
    $event = eventCheckInEvent([
        'district_id' => $pastor->section->district_id,
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular Kit',
    ]);

    createClaimableRegistration(
        $event,
        $pastor,
        $staff,
        $feeCategory,
        2,
        Registration::MODE_ONLINE,
        Registration::STATUS_VERIFIED,
    );
    createCheckInClaim($event, $pastor, $staff, [
        $feeCategory->id => 2,
    ]);

    $this->actingAs($staff)
        ->get(route('event-check-in.index', [
            'event_id' => $event->id,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('event-check-in/index')
            ->where('summary.claimed_quantity', 2)
            ->where('summary.remaining_quantity', 0)
            ->where('churches.data.0.claim_status', 'fully claimed')
            ->where('churches.data.0.remaining_quantity', 0));
});

test('managers only see and process event check-ins within their assigned section', function () {
    $district = District::factory()->create();
    $managedSection = Section::factory()->for($district)->create([
        'name' => 'Section Alpha',
    ]);
    $otherSection = Section::factory()->for($district)->create([
        'name' => 'Section Beta',
    ]);
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $managedSection->id,
    ]);
    $managedPastor = Pastor::factory()->for($managedSection)->create([
        'church_name' => 'Grace Fellowship',
    ]);
    $outsidePastor = Pastor::factory()->for($otherSection)->create([
        'church_name' => 'Outside Section Church',
    ]);
    $event = eventCheckInEvent([
        'district_id' => $district->id,
        'department_id' => null,
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'General Kit',
    ]);

    createClaimableRegistration(
        $event,
        $managedPastor,
        $manager,
        $feeCategory,
        2,
        Registration::MODE_ONLINE,
        Registration::STATUS_VERIFIED,
    );
    createClaimableRegistration(
        $event,
        $outsidePastor,
        $manager,
        $feeCategory,
        3,
        Registration::MODE_ONLINE,
        Registration::STATUS_VERIFIED,
    );

    $this->actingAs($manager)
        ->get(route('event-check-in.index', [
            'event_id' => $event->id,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('event-check-in/index')
            ->where('summary.registered_quantity', 2)
            ->has('churches.data', 1)
            ->where('churches.data.0.church_name', 'Grace Fellowship'));

    $this->actingAs($manager)
        ->post(route('event-check-in.store'), [
            'event_id' => $event->id,
            'pastor_id' => $outsidePastor->id,
            'representative_name' => 'Brother Noel',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity_claimed' => 1,
                    'remarks' => '',
                ],
            ],
            'current_filters' => [
                'section_id' => null,
                'search' => '',
                'claim_status' => 'all',
                'per_page' => 10,
            ],
        ])
        ->assertForbidden();
});

function eventCheckInEvent(array $attributes = []): Event
{
    return Event::factory()->create([
        'name' => 'District Camp 2026',
        'date_from' => '2026-05-05',
        'date_to' => '2026-05-06',
        'status' => Event::STATUS_OPEN,
        'total_capacity' => 100,
        'registration_open_at' => now()->subDays(10),
        'registration_close_at' => now()->addDays(2),
        ...$attributes,
    ]);
}

function createClaimableRegistration(
    Event $event,
    Pastor $pastor,
    User $actor,
    EventFeeCategory $feeCategory,
    int $quantity,
    string $mode,
    string $status,
): Registration {
    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($actor, 'encodedByUser')
        ->create([
            'registration_mode' => $mode,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => $status,
            'submitted_at' => now(),
            'verified_at' => in_array($status, [
                Registration::STATUS_VERIFIED,
                Registration::STATUS_COMPLETED,
            ], true) ? now() : null,
            'verified_by_user_id' => in_array($status, [
                Registration::STATUS_VERIFIED,
                Registration::STATUS_COMPLETED,
            ], true) ? $actor->id : null,
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => $quantity,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => bcmul((string) $feeCategory->amount, (string) $quantity, 2),
        ]);

    return $registration;
}

function createCheckInClaim(
    Event $event,
    Pastor $pastor,
    User $staff,
    array $claims,
): EventCheckIn {
    $eventCheckIn = EventCheckIn::factory()
        ->for($event)
        ->for($pastor)
        ->for($staff, 'checkedInByUser')
        ->create([
            'representative_name' => 'Existing Claim',
            'total_claimed_quantity' => array_sum($claims),
            'checked_in_at' => now()->subHour(),
        ]);

    foreach ($claims as $feeCategoryId => $quantityClaimed) {
        $eventCheckIn->items()->create([
            'fee_category_id' => $feeCategoryId,
            'quantity_claimed' => $quantityClaimed,
            'remarks' => null,
        ]);
    }

    return $eventCheckIn;
}
