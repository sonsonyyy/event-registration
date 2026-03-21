<?php

use App\Models\Department;
use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Section;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can browse district event management pages inside their district scope', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $otherDistrict = District::factory()->create([
        'name' => 'Northern Luzon',
    ]);
    $department = Department::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
        'department_id' => $department->id,
    ]);
    $section = Section::factory()->for($district)->create();
    $managedEvent = Event::factory()->create([
        'name' => 'District Youth Summit',
        'district_id' => $district->id,
        'status' => Event::STATUS_OPEN,
        'department_id' => $department->id,
        'scope_type' => Event::SCOPE_DISTRICT,
        'section_id' => null,
        'total_capacity' => 20,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(3),
    ]);
    $sectionalEvent = Event::factory()->create([
        'name' => 'Section 1 Youth Summit',
        'district_id' => $district->id,
        'status' => Event::STATUS_OPEN,
        'department_id' => $department->id,
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $section->id,
        'total_capacity' => 20,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(3),
    ]);
    $otherDistrictEvent = Event::factory()->create([
        'name' => 'Northern Luzon District Event',
        'district_id' => $otherDistrict->id,
        'status' => Event::STATUS_OPEN,
        'department_id' => $department->id,
        'scope_type' => Event::SCOPE_DISTRICT,
        'section_id' => null,
        'total_capacity' => 20,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(3),
    ]);
    $countedFeeCategory = EventFeeCategory::factory()->for($managedEvent)->create([
        'category_name' => 'Regular (Online)',
        'slot_limit' => 10,
    ]);
    EventFeeCategory::factory()->for($managedEvent)->create([
        'category_name' => 'Regular (Onsite)',
        'slot_limit' => null,
    ]);
    EventFeeCategory::factory()->for($sectionalEvent)->create();
    EventFeeCategory::factory()->for($otherDistrictEvent)->create();
    reserveQuantityForEvent($managedEvent, $countedFeeCategory, 7, Registration::STATUS_PENDING_VERIFICATION);
    reserveQuantityForEvent($managedEvent, $countedFeeCategory, 4, Registration::STATUS_DRAFT);

    $this->actingAs($admin)
        ->get(route('admin.events.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->has('events.data', 1)
            ->where('events.data.0.name', $managedEvent->name)
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
            ->has('scopeTypeOptions', 1)
            ->has('districts', 1)
            ->has('sections')
            ->has('departments')
            ->where('formDefaults.scope_type', Event::SCOPE_DISTRICT)
            ->where('formDefaults.district_id', $district->id)
            ->where('formDefaults.section_id', null)
            ->where('formDefaults.department_id', $department->id)
            ->has('feeCategoryStatusOptions', 2));

    $this->actingAs($admin)
        ->get(route('admin.events.edit', $managedEvent))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/edit')
            ->where('event.name', $managedEvent->name)
            ->where('event.scope_type', Event::SCOPE_DISTRICT)
            ->where('event.district_id', $district->id)
            ->where('event.department_id', $department->id)
            ->where('event.section_id', null)
            ->where('event.remaining_slots', 13)
            ->where('event.fee_categories.0.reserved_quantity', 7));
});

test('admins can search and paginate events by name venue or description', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);

    Event::factory()->create([
        'name' => 'Leaders Summit',
        'district_id' => $district->id,
        'venue' => 'Clark Freeport',
        'description' => 'Leadership training event',
        'date_from' => '2026-06-10',
    ]);

    Event::factory()->create([
        'name' => 'Worship Night',
        'district_id' => $district->id,
        'venue' => 'SMX Clark',
        'description' => 'District-wide gathering',
        'date_from' => '2026-06-12',
    ]);

    Event::factory()->create([
        'name' => 'Youth Conference',
        'district_id' => $district->id,
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

test('managers can browse and manage only their own sectional event pages', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $otherSection = Section::factory()->for($district)->create([
        'name' => 'Section 2',
    ]);
    $department = Department::factory()->create();
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'department_id' => $department->id,
    ]);
    $managedEvent = Event::factory()->create([
        'name' => 'Section 1 Youth Rally',
        'district_id' => $district->id,
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $section->id,
        'department_id' => $department->id,
    ]);
    EventFeeCategory::factory()->for($managedEvent)->create();
    Event::factory()->create([
        'name' => 'Section 2 Youth Rally',
        'district_id' => $district->id,
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $otherSection->id,
        'department_id' => $department->id,
    ]);
    Event::factory()->create([
        'name' => 'District Youth Rally',
        'district_id' => $district->id,
        'scope_type' => Event::SCOPE_DISTRICT,
        'section_id' => null,
        'department_id' => $department->id,
    ]);

    $this->actingAs($manager)
        ->get(route('admin.events.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->has('events.data', 1)
            ->where('events.data.0.name', $managedEvent->name));

    $this->actingAs($manager)
        ->get(route('admin.events.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/create')
            ->has('scopeTypeOptions', 1)
            ->has('districts', 1)
            ->has('sections', 1)
            ->where('formDefaults.scope_type', Event::SCOPE_SECTION)
            ->where('formDefaults.district_id', $district->id)
            ->where('formDefaults.section_id', $section->id)
            ->where('formDefaults.department_id', $department->id));

    $this->actingAs($manager)
        ->get(route('admin.events.edit', $managedEvent))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/edit')
            ->where('event.name', $managedEvent->name)
            ->where('event.scope_type', Event::SCOPE_SECTION)
            ->where('event.district_id', $district->id)
            ->where('event.section_id', $section->id));
});

test('registration staff cannot access event management routes', function () {
    $staff = User::factory()->registrationStaff()->create();

    $this->actingAs($staff)
        ->get(route('admin.events.index'))
        ->assertForbidden();

    $this->actingAs($staff)
        ->post(route('admin.events.store'), eventPayload())
        ->assertForbidden();
});

test('admins can create district-wide events with multiple fee categories', function () {
    $district = District::factory()->create();
    $department = Department::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
        'department_id' => $department->id,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.events.store'), eventPayload([
            'name' => 'District Camp 2026',
            'district_id' => $district->id,
            'department_id' => $department->id,
        ]))
        ->assertRedirect(route('admin.events.index'));

    $event = Event::query()->where('name', 'District Camp 2026')->firstOrFail();

    expect($event->status)->toBe(Event::STATUS_OPEN)
        ->and($event->district_id)->toBe($district->id)
        ->and($event->department_id)->toBe($department->id)
        ->and($event->scope_type)->toBe(Event::SCOPE_DISTRICT)
        ->and($event->feeCategories()->count())->toBe(2)
        ->and($event->feeCategories()->where('category_name', 'Regular (Online)')->exists())->toBeTrue()
        ->and($event->feeCategories()->where('category_name', 'Regular (Onsite)')->exists())->toBeTrue();
});

test('managers can create sectional events inside their own section scope', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $department = Department::factory()->create();
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'department_id' => $department->id,
    ]);

    $this->actingAs($manager)
        ->post(route('admin.events.store'), eventPayload([
            'name' => 'Section 1 Youth Camp',
            'scope_type' => Event::SCOPE_SECTION,
            'district_id' => $district->id,
            'section_id' => $section->id,
            'department_id' => $department->id,
        ]))
        ->assertRedirect(route('admin.events.index'));

    $event = Event::query()->where('name', 'Section 1 Youth Camp')->firstOrFail();

    expect($event->district_id)->toBe($district->id)
        ->and($event->section_id)->toBe($section->id)
        ->and($event->scope_type)->toBe(Event::SCOPE_SECTION)
        ->and($event->department_id)->toBe($department->id);
});

test('event validation enforces owner district and scope rules', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);

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
            'scope_type' => Event::SCOPE_DISTRICT,
            'district_id' => '',
            'section_id' => '',
            'department_id' => 999999,
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
            'district_id',
            'department_id',
            'fee_categories',
        ]);

    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);

    $this->actingAs($manager)
        ->from(route('admin.events.create'))
        ->post(route('admin.events.store'), eventPayload([
            'name' => 'Blocked District Event',
            'district_id' => $district->id,
            'scope_type' => Event::SCOPE_DISTRICT,
            'section_id' => null,
        ]))
        ->assertRedirect(route('admin.events.create'))
        ->assertSessionHasErrors(['scope_type']);
});

test('admins can update district-wide events and synchronize fee categories', function () {
    $district = District::factory()->create();
    $department = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
        'department_id' => $department->id,
    ]);
    $event = Event::factory()->create([
        'district_id' => $district->id,
        'status' => Event::STATUS_DRAFT,
        'department_id' => $department->id,
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
            'scope_type' => Event::SCOPE_DISTRICT,
            'district_id' => $district->id,
            'section_id' => null,
            'department_id' => $department->id,
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
        ->and($event->scope_type)->toBe(Event::SCOPE_DISTRICT)
        ->and($event->district_id)->toBe($district->id)
        ->and($event->section_id)->toBeNull()
        ->and($event->department_id)->toBe($department->id)
        ->and($event->feeCategories()->count())->toBe(2)
        ->and($event->feeCategories()->where('category_name', 'Regular (Online) Updated')->exists())->toBeTrue()
        ->and($event->feeCategories()->where('category_name', 'Regular (Onsite)')->exists())->toBeTrue()
        ->and($event->feeCategories()->whereKey($removedFeeCategory->id)->exists())->toBeFalse();
});

test('managers cannot manage district-wide events and admins cannot manage sectional events', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);
    $districtEvent = Event::factory()->create([
        'district_id' => $district->id,
        'scope_type' => Event::SCOPE_DISTRICT,
        'section_id' => null,
    ]);
    $sectionEvent = Event::factory()->create([
        'district_id' => $district->id,
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $section->id,
    ]);

    $this->actingAs($manager)
        ->get(route('admin.events.edit', $districtEvent))
        ->assertForbidden();

    $this->actingAs($admin)
        ->get(route('admin.events.edit', $sectionEvent))
        ->assertForbidden();
});

test('admins cannot reduce event capacity below reserved quantities or remove used fee categories', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $event = Event::factory()->create([
        'district_id' => $district->id,
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
            'scope_type' => $event->scope_type,
            'district_id' => $event->district_id,
            'section_id' => $event->section_id,
            'department_id' => $event->department_id,
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
            'scope_type' => $event->scope_type,
            'district_id' => $event->district_id,
            'section_id' => $event->section_id,
            'department_id' => $event->department_id,
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

test('admins can delete events without registrations', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $event = Event::factory()->create([
        'district_id' => $district->id,
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create();

    $this->actingAs($admin)
        ->delete(route('admin.events.destroy', $event))
        ->assertRedirect(route('admin.events.index'))
        ->assertInertiaFlash('toasts.0.title', 'Event archived.')
        ->assertSessionHas('success', 'Event archived.');

    $this->assertSoftDeleted('events', ['id' => $event->id]);
    $this->assertSoftDeleted('event_fee_categories', ['id' => $feeCategory->id]);
});

test('admins can archive events with recorded registrations and keep historical relations', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $event = Event::factory()->create([
        'district_id' => $district->id,
        'status' => Event::STATUS_OPEN,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDay(),
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create();

    reserveQuantityForEvent($event, $feeCategory, 3, Registration::STATUS_VERIFIED);

    $this->actingAs($admin)
        ->delete(route('admin.events.destroy', $event))
        ->assertRedirect(route('admin.events.index'))
        ->assertInertiaFlash('toasts.0.title', 'Event archived.')
        ->assertSessionHas('success', 'Event archived.');

    $this->assertSoftDeleted('events', ['id' => $event->id]);
    $this->assertSoftDeleted('event_fee_categories', ['id' => $feeCategory->id]);

    $registration = Registration::query()
        ->with(['event', 'items.feeCategory'])
        ->latest('id')
        ->firstOrFail();

    expect($registration->event)->not->toBeNull()
        ->and($registration->event?->trashed())->toBeTrue()
        ->and($registration->items)->toHaveCount(1)
        ->and($registration->items->first()?->feeCategory)->not->toBeNull()
        ->and($registration->items->first()?->feeCategory?->trashed())->toBeTrue();
});

test('full or expired open events are automatically surfaced as closed with no remaining slots', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $fullEvent = Event::factory()->create([
        'name' => 'Full Event',
        'district_id' => $district->id,
        'status' => Event::STATUS_OPEN,
        'date_from' => '2026-08-01',
        'date_to' => '2026-08-03',
        'total_capacity' => 10,
        'registration_open_at' => now()->subDays(2),
        'registration_close_at' => now()->addDay(),
    ]);
    $expiredEvent = Event::factory()->create([
        'name' => 'Expired Event',
        'district_id' => $district->id,
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
        'scope_type' => Event::SCOPE_DISTRICT,
        'district_id' => null,
        'section_id' => null,
        'department_id' => null,
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
