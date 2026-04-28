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

test('registration staff can create onsite registrations with multiple fee-category line items', function () {
    $pastor = Pastor::factory()->create();
    $staff = User::factory()->registrationStaff()->create([
        'district_id' => $pastor->section->district_id,
    ]);
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
            ->where('pastors.0.section_id', $pastor->section_id)
            ->where('pastors.0.district_id', $pastor->section->district_id));

    $this->actingAs($staff)
        ->post(route('registrations.onsite.store'), [
            'event_id' => $event->id,
            'pastor_id' => $pastor->id,
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
            ->has('registrations.data', 1)
            ->where('registrations.data.0.id', $registration->id)
            ->where('registrations.data.0.total_quantity', 13)
            ->where('registrations.data.0.total_amount', '5900.00')
            ->where('registrations.data.0.items.0.category_name', 'Regular (Onsite)')
            ->where('filters.search', '')
            ->where('filters.per_page', 10)
            ->has('perPageOptions', 3));
});

test('onsite registrations can be searched and paginated', function () {
    $pastor = Pastor::factory()->create([
        'church_name' => 'Grace Community Church',
    ]);
    $staff = User::factory()->registrationStaff()->create([
        'district_id' => $pastor->section->district_id,
    ]);
    $event = onsiteRegistrationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Onsite)',
        'amount' => '500.00',
    ]);

    createOnsiteRegistration($event, $pastor, $staff, $feeCategory, 2);
    createOnsiteRegistration($event, $pastor, $staff, $feeCategory, 3);

    $this->actingAs($staff)
        ->get(route('registrations.onsite.index', [
            'search' => 'Grace',
            'per_page' => 1,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/index')
            ->where('filters.search', 'Grace')
            ->where('filters.per_page', 1)
            ->has('registrations.data', 1)
            ->where('registrations.meta.total', 2)
            ->where('registrations.meta.last_page', 2));
});

test('super admins can filter onsite registrations by section', function () {
    $centralDistrict = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $northernDistrict = District::factory()->create([
        'name' => 'Northern Luzon',
    ]);
    $alphaSection = Section::factory()->for($centralDistrict)->create([
        'name' => 'Alpha Section',
    ]);
    $betaSection = Section::factory()->for($northernDistrict)->create([
        'name' => 'Beta Section',
    ]);
    $alphaPastor = Pastor::factory()->for($alphaSection)->create([
        'church_name' => 'Alpha Community Church',
    ]);
    $betaPastor = Pastor::factory()->for($betaSection)->create([
        'church_name' => 'Beta Gospel Church',
    ]);
    $superAdmin = User::factory()->superAdmin()->create();
    $encoder = User::factory()->registrationStaff()->create();
    $centralEvent = onsiteRegistrationEvent([
        'district_id' => $centralDistrict->id,
    ]);
    $northernEvent = onsiteRegistrationEvent([
        'district_id' => $northernDistrict->id,
    ]);
    $centralFeeCategory = EventFeeCategory::factory()->for($centralEvent)->create();
    $northernFeeCategory = EventFeeCategory::factory()->for($northernEvent)->create();

    createOnsiteRegistration(
        $centralEvent,
        $alphaPastor,
        $encoder,
        $centralFeeCategory,
        2,
    );
    createOnsiteRegistration(
        $northernEvent,
        $betaPastor,
        $encoder,
        $northernFeeCategory,
        3,
    );

    $this->actingAs($superAdmin)
        ->get(route('registrations.onsite.index', [
            'section_id' => $betaSection->id,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/index')
            ->where('filters.section_id', $betaSection->id)
            ->has('sections', 2)
            ->where('sections.0.name', 'Alpha Section')
            ->where('sections.1.name', 'Beta Section')
            ->where('sections.1.district_name', 'Northern Luzon')
            ->has('registrations.data', 1)
            ->where('registrations.data.0.pastor.church_name', 'Beta Gospel Church')
            ->where('registrations.meta.total', 1));
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
    $managedEvent = onsiteRegistrationEvent([
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $managedSection->id,
    ]);
    $outsideEvent = onsiteRegistrationEvent([
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $otherSection->id,
    ]);
    $managedFeeCategory = EventFeeCategory::factory()->for($managedEvent)->create([
        'category_name' => 'Regular (Onsite)',
        'amount' => '450.00',
        'slot_limit' => 20,
    ]);
    $outsideFeeCategory = EventFeeCategory::factory()->for($outsideEvent)->create([
        'category_name' => 'Regular (Onsite)',
        'amount' => '450.00',
        'slot_limit' => 20,
    ]);

    createOnsiteRegistration($managedEvent, $managedPastor, $staff, $managedFeeCategory, 2);
    createOnsiteRegistration($outsideEvent, $outsidePastor, $staff, $outsideFeeCategory, 3);

    $this->actingAs($manager)
        ->get(route('registrations.onsite.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/create')
            ->has('pastors', 1)
            ->where('pastors.0.church_name', 'Grace Community Church')
            ->where('pastors.0.section_id', $managedSection->id)
            ->where('pastors.0.district_id', $district->id));

    $this->actingAs($manager)
        ->get(route('registrations.onsite.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/index')
            ->has('registrations.data', 1)
            ->where('registrations.data.0.pastor.church_name', 'Grace Community Church'));

    $this->actingAs($manager)
        ->post(route('registrations.onsite.store'), [
            'event_id' => $outsideEvent->id,
            'pastor_id' => $outsidePastor->id,
            'payment_reference' => '',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $outsideFeeCategory->id,
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertForbidden();
});

test('admins can post onsite registrations only for district-wide events in their district and department scope', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $otherDistrict = District::factory()->create();
    $otherSection = Section::factory()->for($otherDistrict)->create([
        'name' => 'Outside District',
    ]);
    $pastor = Pastor::factory()->for($section)->create();
    $outsidePastor = Pastor::factory()->for($otherSection)->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $districtEvent = onsiteRegistrationEvent([
        'name' => 'District General Event',
        'department_id' => null,
    ]);
    $sectionEvent = onsiteRegistrationEvent([
        'name' => 'Section General Event',
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $section->id,
        'department_id' => null,
    ]);
    $departmentEvent = onsiteRegistrationEvent([
        'name' => 'District Youth Event',
        'department_id' => Department::factory()->create()->id,
    ]);

    foreach ([$districtEvent, $sectionEvent, $departmentEvent] as $event) {
        EventFeeCategory::factory()->for($event)->create([
            'category_name' => 'Regular (Onsite)',
            'amount' => '500.00',
        ]);
    }

    $this->actingAs($admin)
        ->get(route('registrations.onsite.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/create')
            ->has('events', 1)
            ->where('events.0.id', $districtEvent->id)
            ->where('events.0.name', 'District General Event')
            ->has('pastors', 1)
            ->where('pastors.0.id', $pastor->id));

    $this->actingAs($admin)
        ->post(route('registrations.onsite.store'), [
            'event_id' => $districtEvent->id,
            'pastor_id' => $pastor->id,
            'payment_reference' => 'OR-2026-8101',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $districtEvent->feeCategories()->value('id'),
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.onsite.index'));

    $this->actingAs($admin)
        ->from(route('registrations.onsite.create'))
        ->post(route('registrations.onsite.store'), [
            'event_id' => $sectionEvent->id,
            'pastor_id' => $pastor->id,
            'payment_reference' => 'OR-2026-8102',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $sectionEvent->feeCategories()->value('id'),
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.onsite.create'))
        ->assertSessionHasErrors(['event_id']);

    $this->actingAs($admin)
        ->from(route('registrations.onsite.create'))
        ->post(route('registrations.onsite.store'), [
            'event_id' => $districtEvent->id,
            'pastor_id' => $outsidePastor->id,
            'payment_reference' => 'OR-2026-8103',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $districtEvent->feeCategories()->value('id'),
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertForbidden();
});

test('department-scoped managers only see onsite events in their section and department', function () {
    $district = District::factory()->create();
    $managedSection = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $otherSection = Section::factory()->for($district)->create([
        'name' => 'Section 2',
    ]);
    $youthDepartment = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $ladiesDepartment = Department::factory()->create([
        'name' => 'Ladies Ministries',
    ]);
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $managedSection->id,
        'department_id' => $youthDepartment->id,
    ]);
    $pastor = Pastor::factory()->for($managedSection)->create();

    $accessibleEvent = onsiteRegistrationEvent([
        'name' => 'Section 1 Youth Event',
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $managedSection->id,
        'department_id' => $youthDepartment->id,
        'date_from' => now()->addDay()->toDateString(),
        'date_to' => now()->addDays(2)->toDateString(),
    ]);
    $otherDepartmentEvent = onsiteRegistrationEvent([
        'name' => 'Section 1 Ladies Event',
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $managedSection->id,
        'department_id' => $ladiesDepartment->id,
    ]);
    $otherSectionEvent = onsiteRegistrationEvent([
        'name' => 'Section 2 Youth Event',
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $otherSection->id,
        'department_id' => $youthDepartment->id,
    ]);
    $districtEvent = onsiteRegistrationEvent([
        'name' => 'District Youth Event',
        'department_id' => $youthDepartment->id,
        'date_from' => now()->addDays(3)->toDateString(),
        'date_to' => now()->addDays(4)->toDateString(),
    ]);

    foreach ([$accessibleEvent, $otherDepartmentEvent, $otherSectionEvent, $districtEvent] as $event) {
        EventFeeCategory::factory()->for($event)->create([
            'category_name' => 'Regular (Onsite)',
            'amount' => '500.00',
        ]);
    }

    $this->actingAs($manager)
        ->get(route('registrations.onsite.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/create')
            ->has('events', 2)
            ->where('events.0.id', $accessibleEvent->id)
            ->where('events.0.name', 'Section 1 Youth Event')
            ->where('events.1.id', $districtEvent->id)
            ->where('events.1.name', 'District Youth Event'));

    $this->actingAs($manager)
        ->from(route('registrations.onsite.create'))
        ->post(route('registrations.onsite.store'), [
            'event_id' => $otherDepartmentEvent->id,
            'pastor_id' => $pastor->id,
            'payment_reference' => 'OR-2026-9201',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $otherDepartmentEvent->feeCategories()->value('id'),
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.onsite.create'))
        ->assertSessionHasErrors(['event_id']);

    expect(Registration::query()->count())->toBe(0);
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
    $pastor = Pastor::factory()->create();
    $staff = User::factory()->registrationStaff()->create([
        'district_id' => $pastor->section->district_id,
    ]);
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

test('onsite registrations require an official receipt or reference number on create and update', function () {
    $pastor = Pastor::factory()->create();
    $staff = User::factory()->registrationStaff()->create([
        'district_id' => $pastor->section->district_id,
    ]);
    $event = onsiteRegistrationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Onsite)',
        'amount' => '950.00',
    ]);

    $this->actingAs($staff)
        ->from(route('registrations.onsite.create'))
        ->post(route('registrations.onsite.store'), [
            'event_id' => $event->id,
            'pastor_id' => $pastor->id,
            'payment_reference' => '',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.onsite.create'))
        ->assertSessionHasErrors(['payment_reference']);

    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($staff, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONSITE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_COMPLETED,
            'payment_reference' => 'OR-2026-4001',
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => 2,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => '1900.00',
        ]);

    $this->actingAs($staff)
        ->from(route('registrations.onsite.edit', $registration))
        ->patch(route('registrations.onsite.update', $registration), [
            'event_id' => $event->id,
            'pastor_id' => $pastor->id,
            'payment_reference' => '',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity' => 2,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.onsite.edit', $registration))
        ->assertSessionHasErrors(['payment_reference']);
});

test('staff can edit onsite registrations and replace grouped quantities', function () {
    $pastor = Pastor::factory()->create([
        'church_name' => 'UPC',
        'pastor_name' => 'Jefhte Inso',
    ]);
    $staff = User::factory()->registrationStaff()->create([
        'district_id' => $pastor->section->district_id,
    ]);
    $updatedPastor = Pastor::factory()->for($pastor->section)->create([
        'church_name' => 'UPC',
        'pastor_name' => 'Junar Tongol',
    ]);
    $event = onsiteRegistrationEvent();
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Onsite)',
        'amount' => '950.00',
        'slot_limit' => 40,
    ]);
    $oneDayPass = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'One-day Pass',
        'amount' => '600.00',
        'status' => 'inactive',
        'slot_limit' => 15,
    ]);

    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($staff, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONSITE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_COMPLETED,
            'payment_reference' => 'OR-2026-3001',
            'remarks' => 'Original onsite transaction',
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($oneDayPass, 'feeCategory')
        ->create([
            'quantity' => 2,
            'unit_amount' => $oneDayPass->amount,
            'subtotal_amount' => '1200.00',
        ]);

    $this->actingAs($staff)
        ->get(route('registrations.onsite.edit', $registration))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/onsite/edit')
            ->where('registration.id', $registration->id)
            ->where('registration.pastor_id', (string) $pastor->id)
            ->where('registration.line_items.0.fee_category_id', (string) $oneDayPass->id));

    $this->actingAs($staff)
        ->patch(route('registrations.onsite.update', $registration), [
            'event_id' => $event->id,
            'pastor_id' => $updatedPastor->id,
            'payment_reference' => 'OR-2026-3002',
            'remarks' => 'Corrected onsite transaction',
            'line_items' => [
                [
                    'fee_category_id' => $regular->id,
                    'quantity' => 5,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.onsite.index'));

    $registration->refresh()->load('items.feeCategory');

    expect($registration->pastor_id)->toBe($updatedPastor->id)
        ->and($registration->payment_reference)->toBe('OR-2026-3002')
        ->and($registration->remarks)->toBe('Corrected onsite transaction')
        ->and($registration->items)->toHaveCount(1)
        ->and($registration->items->first()->feeCategory->category_name)->toBe('Regular (Onsite)')
        ->and($registration->items->first()->quantity)->toBe(5);
});

test('onsite registration update rejects capacity overflow while preserving current reserved quantity', function () {
    $pastor = Pastor::factory()->create();
    $staff = User::factory()->registrationStaff()->create([
        'district_id' => $pastor->section->district_id,
    ]);
    $event = onsiteRegistrationEvent([
        'total_capacity' => 5,
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Onsite)',
        'amount' => '500.00',
        'slot_limit' => 5,
    ]);

    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($staff, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONSITE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_COMPLETED,
            'payment_reference' => 'OR-2026-5101',
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => 2,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => '1000.00',
        ]);

    $otherRegistration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($staff, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONSITE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_COMPLETED,
            'payment_reference' => 'OR-2026-5102',
        ]);

    RegistrationItem::factory()
        ->for($otherRegistration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => 3,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => '1500.00',
        ]);

    $this->actingAs($staff)
        ->from(route('registrations.onsite.edit', $registration))
        ->patch(route('registrations.onsite.update', $registration), [
            'event_id' => $event->id,
            'pastor_id' => $pastor->id,
            'payment_reference' => 'OR-2026-5103',
            'remarks' => 'Trying to exceed remaining capacity.',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity' => 3,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.onsite.edit', $registration))
        ->assertSessionHasErrors([
            'line_items.0.quantity',
            'line_items',
        ]);

    expect((int) $registration->fresh()->items()->sum('quantity'))->toBe(2);
});

function onsiteRegistrationEvent(array $attributes = []): Event
{
    $sectionId = $attributes['section_id'] ?? null;
    $districtId = $attributes['district_id']
        ?? ($sectionId !== null
            ? Section::query()->find($sectionId)?->district_id
            : District::query()->value('id'));

    return Event::factory()->create([
        'name' => 'District Camp 2026',
        'status' => Event::STATUS_OPEN,
        'total_capacity' => 50,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(5),
        'district_id' => $districtId,
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
