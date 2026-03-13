<?php

use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Section;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('registration staff can create onsite registrations with multiple fee-category line items', function () {
    $staff = User::factory()->registrationStaff()->create();
    $pastor = Pastor::factory()->create();
    $event = onsiteRegistrationEvent();
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Onsite)',
        'amount' => '500.00',
        'slot_limit' => 30,
    ]);
    $oneDayPass = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'One-day Pass',
        'amount' => '300.00',
        'slot_limit' => null,
    ]);

    $this->actingAs($staff)
        ->get(route('registrations.onsite.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/create')
            ->has('events', 1)
            ->where('events.0.name', $event->name)
            ->has('events.0.fee_categories', 2)
            ->where('pastors.0.church_name', $pastor->church_name)
            ->has('paymentStatusOptions', 3));

    $this->actingAs($staff)
        ->post(route('registrations.onsite.store'), [
            'event_id' => $event->id,
            'pastor_id' => $pastor->id,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'payment_reference' => 'OR-2026-1001',
            'remarks' => 'Walk-in group registration',
            'line_items' => [
                [
                    'fee_category_id' => $regular->id,
                    'quantity' => 10,
                ],
                [
                    'fee_category_id' => $oneDayPass->id,
                    'quantity' => 3,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.onsite.index'));

    $registration = Registration::query()
        ->with('items.feeCategory')
        ->firstOrFail();

    expect($registration->registration_mode)->toBe(Registration::MODE_ONSITE)
        ->and($registration->payment_status)->toBe(Registration::PAYMENT_STATUS_PAID)
        ->and($registration->registration_status)->toBe(Registration::STATUS_COMPLETED)
        ->and($registration->payment_reference)->toBe('OR-2026-1001')
        ->and($registration->encoded_by_user_id)->toBe($staff->id)
        ->and($registration->totalQuantity())->toBe(13)
        ->and($registration->items)->toHaveCount(2)
        ->and($registration->items->firstWhere('fee_category_id', $regular->id)?->subtotal_amount)->toBe('5000.00')
        ->and($registration->items->firstWhere('fee_category_id', $oneDayPass->id)?->subtotal_amount)->toBe('900.00');

    $this->actingAs($staff)
        ->get(route('registrations.onsite.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/index')
            ->has('registrations', 1)
            ->where('registrations.0.id', $registration->id)
            ->where('registrations.0.total_quantity', 13)
            ->where('registrations.0.total_amount', '5900.00')
            ->where('registrations.0.items.0.category_name', 'Regular (Onsite)'));
});

test('managers are limited to onsite registrations and pastors within their assigned section', function () {
    $district = District::factory()->create();
    $managedSection = Section::factory()->for($district)->create();
    $otherSection = Section::factory()->for($district)->create();
    $manager = User::factory()->manager()->create([
        'section_id' => $managedSection->id,
    ]);
    $staff = User::factory()->registrationStaff()->create();
    $managedPastor = Pastor::factory()->for($managedSection)->create([
        'church_name' => 'Grace Community Church',
    ]);
    $outsidePastor = Pastor::factory()->for($otherSection)->create([
        'church_name' => 'Outside Section Church',
    ]);
    $event = onsiteRegistrationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Onsite)',
        'amount' => '450.00',
        'slot_limit' => 20,
    ]);

    createOnsiteRegistration($event, $managedPastor, $staff, $feeCategory, 2);
    createOnsiteRegistration($event, $outsidePastor, $staff, $feeCategory, 3);

    $this->actingAs($manager)
        ->get(route('registrations.onsite.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/create')
            ->has('pastors', 1)
            ->where('pastors.0.church_name', 'Grace Community Church'));

    $this->actingAs($manager)
        ->get(route('registrations.onsite.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/index')
            ->has('registrations', 1)
            ->where('registrations.0.pastor.church_name', 'Grace Community Church'));

    $this->actingAs($manager)
        ->post(route('registrations.onsite.store'), [
            'event_id' => $event->id,
            'pastor_id' => $outsidePastor->id,
            'payment_status' => Registration::PAYMENT_STATUS_UNPAID,
            'payment_reference' => '',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertForbidden();
});

test('online registrants cannot access onsite registration routes', function () {
    $onlineRegistrant = User::factory()->onlineRegistrant()->create();
    $event = onsiteRegistrationEvent();
    $pastor = Pastor::factory()->create();
    $feeCategory = EventFeeCategory::factory()->for($event)->create();

    $this->actingAs($onlineRegistrant)
        ->get(route('registrations.onsite.index'))
        ->assertForbidden();

    $this->actingAs($onlineRegistrant)
        ->get(route('registrations.onsite.create'))
        ->assertForbidden();

    $this->actingAs($onlineRegistrant)
        ->post(route('registrations.onsite.store'), [
            'event_id' => $event->id,
            'pastor_id' => $pastor->id,
            'payment_status' => Registration::PAYMENT_STATUS_UNPAID,
            'payment_reference' => '',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertForbidden();
});

test('onsite registration rejects invalid fee-category selections and capacity overflow', function () {
    $staff = User::factory()->registrationStaff()->create();
    $pastor = Pastor::factory()->create();
    $event = onsiteRegistrationEvent([
        'total_capacity' => 5,
    ]);
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Onsite)',
        'amount' => '500.00',
        'slot_limit' => 4,
    ]);
    $otherEvent = onsiteRegistrationEvent([
        'name' => 'Youth Rally 2026',
    ]);
    $otherEventCategory = EventFeeCategory::factory()->for($otherEvent)->create([
        'category_name' => 'Other Event Pass',
    ]);

    reserveQuantityForOnsiteRegistrationEvent($event, $regular, 4, Registration::STATUS_VERIFIED);

    $this->actingAs($staff)
        ->from(route('registrations.onsite.create'))
        ->post(route('registrations.onsite.store'), [
            'event_id' => $event->id,
            'pastor_id' => $pastor->id,
            'payment_status' => Registration::PAYMENT_STATUS_PARTIAL,
            'payment_reference' => 'OR-2026-2001',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $otherEventCategory->id,
                    'quantity' => 1,
                ],
                [
                    'fee_category_id' => $regular->id,
                    'quantity' => 2,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.onsite.create'))
        ->assertSessionHasErrors([
            'line_items.0.fee_category_id',
            'line_items.1.quantity',
            'line_items',
        ]);

    expect(Registration::query()->count())->toBe(1)
        ->and(RegistrationItem::query()->count())->toBe(1);
});

function onsiteRegistrationEvent(array $attributes = []): Event
{
    return Event::factory()->create([
        'name' => 'District Camp 2026',
        'status' => Event::STATUS_OPEN,
        'total_capacity' => 50,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(5),
        ...$attributes,
    ]);
}

function createOnsiteRegistration(
    Event $event,
    Pastor $pastor,
    User $encodedBy,
    EventFeeCategory $feeCategory,
    int $quantity,
): Registration {
    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($encodedBy, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONSITE,
            'registration_status' => Registration::STATUS_COMPLETED,
            'submitted_at' => now(),
            'verified_at' => null,
            'verified_by_user_id' => null,
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

function reserveQuantityForOnsiteRegistrationEvent(
    Event $event,
    EventFeeCategory $feeCategory,
    int $quantity,
    string $registrationStatus,
): Registration {
    $pastor = Pastor::factory()->create();
    $encoder = User::factory()->registrationStaff()->create();
    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONSITE,
            'registration_status' => $registrationStatus,
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
