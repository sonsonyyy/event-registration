<?php

use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can browse the event management pages', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->create([
        'status' => Event::STATUS_OPEN,
        'total_capacity' => 20,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(3),
    ]);
    $countedFeeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'slot_limit' => 10,
    ]);
    EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Onsite)',
        'slot_limit' => null,
    ]);
    reserveQuantityForEvent($event, $countedFeeCategory, 7, Registration::STATUS_PENDING_VERIFICATION);
    reserveQuantityForEvent($event, $countedFeeCategory, 4, Registration::STATUS_DRAFT);

    $this->actingAs($admin)
        ->get(route('admin.events.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->has('events.data', 1)
            ->where('events.data.0.name', $event->name)
            ->where('events.data.0.reserved_quantity', 7)
            ->where('events.data.0.remaining_slots', 13)
            ->where('events.data.0.status', Event::STATUS_OPEN)
            ->where('events.data.0.fee_categories_count', 2)
            ->where('filters.search', '')
            ->where('filters.per_page', 10)
            ->has('perPageOptions', 3));

    $this->actingAs($admin)
        ->get(route('admin.events.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/create')
            ->has('statusOptions', 5)
            ->has('feeCategoryStatusOptions', 2));

    $this->actingAs($admin)
        ->get(route('admin.events.edit', $event))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/edit')
            ->where('event.name', $event->name)
            ->where('event.remaining_slots', 13)
            ->where('event.fee_categories.0.reserved_quantity', 7));
});

test('admins can search and paginate events by name venue or description', function () {
    $admin = User::factory()->admin()->create();

    Event::factory()->create([
        'name' => 'Leaders Summit',
        'venue' => 'Clark Freeport',
        'description' => 'Leadership training event',
        'date_from' => '2026-06-10',
    ]);

    Event::factory()->create([
        'name' => 'Worship Night',
        'venue' => 'SMX Clark',
        'description' => 'District-wide gathering',
        'date_from' => '2026-06-12',
    ]);

    Event::factory()->create([
        'name' => 'Youth Conference',
        'venue' => 'San Fernando',
        'description' => 'Held near Clark for section leaders',
        'date_from' => '2026-06-14',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.events.index', [
            'search' => 'Clark',
            'per_page' => 1,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->where('filters.search', 'Clark')
            ->where('filters.per_page', 1)
            ->has('events.data', 1)
            ->where('events.meta.total', 3)
            ->where('events.meta.last_page', 3)
            ->where('events.data.0.name', 'Youth Conference'));
});

test('non admins cannot access admin event management routes', function () {
    $manager = User::factory()->manager()->create();

    $this->actingAs($manager)
        ->get(route('admin.events.index'))
        ->assertForbidden();

    $this->actingAs($manager)
        ->post(route('admin.events.store'), eventPayload())
        ->assertForbidden();
});

test('admins can create events with multiple fee categories', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.events.store'), eventPayload([
            'name' => 'District Camp 2026',
        ]))
        ->assertRedirect(route('admin.events.index'));

    $event = Event::query()->where('name', 'District Camp 2026')->firstOrFail();

    expect($event->status)->toBe(Event::STATUS_OPEN)
        ->and($event->feeCategories()->count())->toBe(2)
        ->and($event->feeCategories()->where('category_name', 'Regular (Online)')->exists())->toBeTrue()
        ->and($event->feeCategories()->where('category_name', 'Regular (Onsite)')->exists())->toBeTrue();
});

test('admins must pass the event validation rules', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->from(route('admin.events.create'))
        ->post(route('admin.events.store'), [
            'name' => '',
            'description' => '',
            'venue' => '',
            'date_from' => '2026-06-12',
            'date_to' => '2026-06-10',
            'registration_open_at' => '2026-06-05T08:00',
            'registration_close_at' => '2026-06-04T08:00',
            'total_capacity' => 10,
            'status' => Event::STATUS_OPEN,
            'fee_categories' => [
                [
                    'category_name' => 'Regular',
                    'amount' => '500.00',
                    'slot_limit' => 8,
                    'status' => 'active',
                ],
                [
                    'category_name' => 'regular',
                    'amount' => '450.00',
                    'slot_limit' => 8,
                    'status' => 'active',
                ],
            ],
        ])
        ->assertRedirect(route('admin.events.create'))
        ->assertSessionHasErrors([
            'name',
            'venue',
            'date_to',
            'registration_close_at',
            'fee_categories',
        ]);
});

test('admins can update events and synchronize fee categories', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->create([
        'status' => Event::STATUS_DRAFT,
        'total_capacity' => 100,
        'registration_open_at' => now()->addDay(),
        'registration_close_at' => now()->addDays(10),
    ]);
    $retainedFeeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
    ]);
    $removedFeeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'One-day Pass',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.events.update', $event), [
            'name' => 'Updated District Camp',
            'description' => 'Updated description',
            'venue' => 'Updated Venue',
            'date_from' => '2026-07-01',
            'date_to' => '2026-07-03',
            'registration_open_at' => '2026-06-15T09:00',
            'registration_close_at' => '2026-06-30T18:00',
            'total_capacity' => 250,
            'status' => Event::STATUS_OPEN,
            'fee_categories' => [
                [
                    'id' => $retainedFeeCategory->id,
                    'category_name' => 'Regular (Online) Updated',
                    'amount' => '650.00',
                    'slot_limit' => 150,
                    'status' => 'active',
                ],
                [
                    'category_name' => 'Regular (Onsite)',
                    'amount' => '700.00',
                    'slot_limit' => 100,
                    'status' => 'active',
                ],
            ],
        ])
        ->assertRedirect(route('admin.events.index'));

    expect($event->refresh()->name)->toBe('Updated District Camp')
        ->and($event->venue)->toBe('Updated Venue')
        ->and($event->status)->toBe(Event::STATUS_OPEN)
        ->and($event->feeCategories()->count())->toBe(2)
        ->and($event->feeCategories()->where('category_name', 'Regular (Online) Updated')->exists())->toBeTrue()
        ->and($event->feeCategories()->where('category_name', 'Regular (Onsite)')->exists())->toBeTrue()
        ->and($event->feeCategories()->whereKey($removedFeeCategory->id)->exists())->toBeFalse();
});

test('admins cannot reduce event capacity below reserved quantities or remove used fee categories', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->create([
        'status' => Event::STATUS_OPEN,
        'total_capacity' => 10,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(2),
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'slot_limit' => 10,
    ]);
    reserveQuantityForEvent($event, $feeCategory, 6, Registration::STATUS_VERIFIED);

    $this->actingAs($admin)
        ->from(route('admin.events.edit', $event))
        ->patch(route('admin.events.update', $event), [
            'name' => $event->name,
            'description' => $event->description,
            'venue' => $event->venue,
            'date_from' => $event->date_from->toDateString(),
            'date_to' => $event->date_to->toDateString(),
            'registration_open_at' => $event->registration_open_at->format('Y-m-d\TH:i'),
            'registration_close_at' => $event->registration_close_at->format('Y-m-d\TH:i'),
            'total_capacity' => 5,
            'status' => Event::STATUS_OPEN,
            'fee_categories' => [],
        ])
        ->assertRedirect(route('admin.events.edit', $event))
        ->assertSessionHasErrors(['total_capacity', 'fee_categories']);

    $this->actingAs($admin)
        ->from(route('admin.events.edit', $event))
        ->patch(route('admin.events.update', $event), [
            'name' => $event->name,
            'description' => $event->description,
            'venue' => $event->venue,
            'date_from' => $event->date_from->toDateString(),
            'date_to' => $event->date_to->toDateString(),
            'registration_open_at' => $event->registration_open_at->format('Y-m-d\TH:i'),
            'registration_close_at' => $event->registration_close_at->format('Y-m-d\TH:i'),
            'total_capacity' => 10,
            'status' => Event::STATUS_OPEN,
            'fee_categories' => [
                [
                    'id' => $feeCategory->id,
                    'category_name' => $feeCategory->category_name,
                    'amount' => '500.00',
                    'slot_limit' => 5,
                    'status' => 'active',
                ],
            ],
        ])
        ->assertRedirect(route('admin.events.edit', $event))
        ->assertSessionHasErrors(['fee_categories.0.slot_limit']);
});

test('full or expired open events are automatically surfaced as closed with no remaining slots', function () {
    $admin = User::factory()->admin()->create();
    $fullEvent = Event::factory()->create([
        'name' => 'Full Event',
        'status' => Event::STATUS_OPEN,
        'date_from' => '2026-08-01',
        'date_to' => '2026-08-03',
        'total_capacity' => 10,
        'registration_open_at' => now()->subDays(2),
        'registration_close_at' => now()->addDay(),
    ]);
    $expiredEvent = Event::factory()->create([
        'name' => 'Expired Event',
        'status' => Event::STATUS_OPEN,
        'date_from' => '2026-09-01',
        'date_to' => '2026-09-03',
        'total_capacity' => 20,
        'registration_open_at' => now()->subDays(5),
        'registration_close_at' => now()->subMinute(),
    ]);
    $fullFeeCategory = EventFeeCategory::factory()->for($fullEvent)->create();
    EventFeeCategory::factory()->for($expiredEvent)->create();

    reserveQuantityForEvent($fullEvent, $fullFeeCategory, 10, Registration::STATUS_PENDING_VERIFICATION);

    $this->actingAs($admin)
        ->get(route('admin.events.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->has('events.data', 2)
            ->where('events.data.0.name', 'Expired Event')
            ->where('events.data.0.status', Event::STATUS_CLOSED)
            ->where('events.data.0.remaining_slots', 20)
            ->where('events.data.1.name', 'Full Event')
            ->where('events.data.1.status', Event::STATUS_CLOSED)
            ->where('events.data.1.remaining_slots', 0));

    expect($fullEvent->refresh()->status)->toBe(Event::STATUS_CLOSED)
        ->and($expiredEvent->refresh()->status)->toBe(Event::STATUS_CLOSED);
});

function eventPayload(array $overrides = []): array
{
    return array_replace_recursive([
        'name' => 'District Youth Camp',
        'description' => 'Three-day district gathering.',
        'venue' => 'Main Convention Hall',
        'date_from' => '2026-06-20',
        'date_to' => '2026-06-22',
        'registration_open_at' => '2026-06-01T08:00',
        'registration_close_at' => '2026-06-18T18:00',
        'total_capacity' => 500,
        'status' => Event::STATUS_OPEN,
        'fee_categories' => [
            [
                'category_name' => 'Regular (Online)',
                'amount' => '500.00',
                'slot_limit' => 250,
                'status' => 'active',
            ],
            [
                'category_name' => 'Regular (Onsite)',
                'amount' => '550.00',
                'slot_limit' => 250,
                'status' => 'active',
            ],
        ],
    ], $overrides);
}

function reserveQuantityForEvent(
    Event $event,
    EventFeeCategory $feeCategory,
    int $quantity,
    string $registrationStatus,
): void {
    $registration = Registration::factory()
        ->for($event)
        ->for(Pastor::factory()->create())
        ->for(User::factory()->registrationStaff()->create(), 'encodedByUser')
        ->create([
            'registration_status' => $registrationStatus,
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => $quantity,
            'unit_amount' => 500,
            'subtotal_amount' => $quantity * 500,
        ]);
}
