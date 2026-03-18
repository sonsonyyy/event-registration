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
use App\Notifications\RegistrationResubmitted;
use App\Notifications\RegistrationSubmittedForReview;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('online registrants can submit registrations with receipt upload stored on the configured disk', function () {
    Notification::fake();

    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $section = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $pastor = Pastor::factory()->for($section)->create([
        'church_name' => 'Grace Community Church',
        'pastor_name' => 'Pastor Jane Doe',
    ]);
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $pastor->id,
    ]);
    $reviewer = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $event = onlineRegistrationEvent();
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
        'slot_limit' => 50,
    ]);
    $oneDayPass = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'One-day Pass',
        'amount' => '600.00',
        'slot_limit' => null,
    ]);

    $this->actingAs($registrant)
        ->get(route('registrations.online.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/online/create')
            ->where('assignedPastor.church_name', 'Grace Community Church')
            ->has('events', 1)
            ->where('events.0.name', $event->name));

    $this->actingAs($registrant)
        ->post(route('registrations.online.store'), [
            'event_id' => $event->id,
            'payment_reference' => 'DEP-2026-0001',
            'receipt' => UploadedFile::fake()->create('receipt.pdf', 256, 'application/pdf'),
            'remarks' => 'Bank deposit submitted by the local church treasurer.',
            'line_items' => [
                [
                    'fee_category_id' => $regular->id,
                    'quantity' => 4,
                ],
                [
                    'fee_category_id' => $oneDayPass->id,
                    'quantity' => 2,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.online.index'))
        ->assertInertiaFlash('toasts.0.title', 'Online registration submitted.');

    $registration = Registration::query()
        ->with('items.feeCategory')
        ->firstOrFail();

    expect($registration->registration_mode)->toBe(Registration::MODE_ONLINE)
        ->and($registration->payment_status)->toBe(Registration::PAYMENT_STATUS_PAID)
        ->and($registration->registration_status)->toBe(Registration::STATUS_PENDING_VERIFICATION)
        ->and($registration->payment_reference)->toBe('DEP-2026-0001')
        ->and($registration->encoded_by_user_id)->toBe($registrant->id)
        ->and($registration->receipt_uploaded_by_user_id)->toBe($registrant->id)
        ->and($registration->receipt_original_name)->toBe('receipt.pdf')
        ->and($registration->receipt_file_path)->not->toBeNull()
        ->and($registration->totalQuantity())->toBe(6)
        ->and($registration->items)->toHaveCount(2)
        ->and($registration->items->firstWhere('fee_category_id', $regular->id)?->subtotal_amount)->toBe('3200.00')
        ->and($registration->items->firstWhere('fee_category_id', $oneDayPass->id)?->subtotal_amount)->toBe('1200.00');

    Storage::disk('local')->assertExists((string) $registration->receipt_file_path);
    Notification::assertSentTo($reviewer, RegistrationSubmittedForReview::class);

    $this->actingAs($registrant)
        ->get(route('registrations.online.index', [
            'search' => 'receipt.pdf',
            'per_page' => 10,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/online/index')
            ->where('assignedPastor.church_name', 'Grace Community Church')
            ->where('filters.search', 'receipt.pdf')
            ->where('filters.per_page', 10)
            ->has('registrations.data', 1)
            ->where('registrations.data.0.submitted_by_name', $registrant->name)
            ->where('registrations.data.0.registration_status', Registration::STATUS_PENDING_VERIFICATION)
            ->where('registrations.data.0.total_quantity', 6)
            ->where('registrations.data.0.receipt.original_name', 'receipt.pdf'));
});

test('online registrants only see accessible events and cannot submit registrations for other sections', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $sectionOne = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $sectionTwo = Section::factory()->for($district)->create([
        'name' => 'Section 2',
    ]);
    $youthDepartment = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $ladiesDepartment = Department::factory()->create([
        'name' => 'Ladies Ministries',
    ]);
    $pastor = Pastor::factory()->for($sectionOne)->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $sectionOne->id,
        'pastor_id' => $pastor->id,
    ]);

    $districtEvent = onlineRegistrationEvent([
        'name' => 'District General Event',
    ]);
    $districtDepartmentEvent = onlineRegistrationEvent([
        'name' => 'District Youth Event',
        'department_id' => $youthDepartment->id,
    ]);
    $sameSectionEvent = onlineRegistrationEvent([
        'name' => 'Section 1 Ladies Event',
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $sectionOne->id,
        'department_id' => $ladiesDepartment->id,
    ]);
    $otherSectionEvent = onlineRegistrationEvent([
        'name' => 'Section 2 Event',
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $sectionTwo->id,
    ]);

    foreach ([$districtEvent, $districtDepartmentEvent, $sameSectionEvent, $otherSectionEvent] as $event) {
        EventFeeCategory::factory()->for($event)->create([
            'category_name' => 'Regular',
            'amount' => '750.00',
        ]);
    }

    $this->actingAs($registrant)
        ->get(route('registrations.online.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/online/create')
            ->has('events', 3)
            ->where('events', fn ($events): bool => collect($events)
                ->pluck('id')
                ->sort()
                ->values()
                ->all() === collect([
                    $districtEvent->id,
                    $districtDepartmentEvent->id,
                    $sameSectionEvent->id,
                ])->sort()->values()->all()));

    $this->actingAs($registrant)
        ->from(route('registrations.online.create'))
        ->post(route('registrations.online.store'), [
            'event_id' => $otherSectionEvent->id,
            'payment_reference' => 'DEP-2026-2001',
            'receipt' => UploadedFile::fake()->create('receipt.pdf', 256, 'application/pdf'),
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $otherSectionEvent->feeCategories()->value('id'),
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.online.create'))
        ->assertSessionHasErrors(['event_id']);

    expect(Registration::query()->count())->toBe(0);
});

test('online registrations can store receipts on s3 when the configured disk uses s3', function () {
    Storage::fake('s3');
    config()->set('registration.receipts_disk', 's3');
    config()->set('filesystems.disks.s3.bucket', 'event-registration-receipts');
    config()->set('filesystems.disks.s3.region', 'ap-southeast-1');

    $pastor = Pastor::factory()->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
    ]);
    $event = onlineRegistrationEvent();
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);

    $this->actingAs($registrant)
        ->post(route('registrations.online.store'), [
            'event_id' => $event->id,
            'payment_reference' => 'DEP-2026-0002',
            'receipt' => UploadedFile::fake()->image('receipt.png'),
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $regular->id,
                    'quantity' => 3,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.online.index'));

    $registration = Registration::query()->firstOrFail();

    expect($registration->receipt_file_path)->not->toBeNull();

    Storage::disk('s3')->assertExists((string) $registration->receipt_file_path);
});

test('online registrations require a receipt reference number on create and update', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $pastor = Pastor::factory()->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
    ]);
    $event = onlineRegistrationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);

    $this->actingAs($registrant)
        ->from(route('registrations.online.create'))
        ->post(route('registrations.online.store'), [
            'event_id' => $event->id,
            'payment_reference' => '',
            'receipt' => UploadedFile::fake()->create('receipt.pdf', 256, 'application/pdf'),
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity' => 1,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.online.create'))
        ->assertSessionHasErrors(['payment_reference']);

    Storage::disk('local')->put(
        'registration-receipts/2026/03/reference-required.pdf',
        'existing-receipt',
    );

    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->for($registrant, 'receiptUploadedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_NEEDS_CORRECTION,
            'payment_reference' => 'DEP-2026-4001',
            'receipt_file_path' => 'registration-receipts/2026/03/reference-required.pdf',
            'receipt_original_name' => 'reference-required.pdf',
            'receipt_uploaded_at' => now()->subHour(),
            'submitted_at' => now()->subHour(),
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => 2,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => '1600.00',
        ]);

    $this->actingAs($registrant)
        ->from(route('registrations.online.edit', $registration))
        ->patch(route('registrations.online.update', $registration), [
            'event_id' => $event->id,
            'payment_reference' => '',
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity' => 2,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.online.edit', $registration))
        ->assertSessionHasErrors(['payment_reference']);
});

test('non-registrant roles cannot access online registration routes', function () {
    $manager = User::factory()->manager()->create();
    $staff = User::factory()->registrationStaff()->create();
    $event = onlineRegistrationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create();

    foreach ([$manager, $staff] as $user) {
        $this->actingAs($user)
            ->get(route('registrations.online.index'))
            ->assertForbidden();

        $this->actingAs($user)
            ->get(route('registrations.online.create'))
            ->assertForbidden();

        $this->actingAs($user)
            ->post(route('registrations.online.store'), [
                'event_id' => $event->id,
                'payment_reference' => '',
                'receipt' => UploadedFile::fake()->create('receipt.pdf', 256, 'application/pdf'),
                'remarks' => '',
                'line_items' => [
                    [
                        'fee_category_id' => $feeCategory->id,
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertForbidden();
    }
});

test('pending registrant accounts cannot access online registration routes', function () {
    $pastor = Pastor::factory()->create();
    $pendingRegistrant = User::factory()
        ->onlineRegistrant()
        ->pendingApproval()
        ->create([
            'district_id' => $pastor->section->district_id,
            'section_id' => $pastor->section_id,
            'pastor_id' => $pastor->id,
        ]);
    $event = onlineRegistrationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create();

    $this->actingAs($pendingRegistrant)
        ->get(route('registrations.online.index'))
        ->assertForbidden();

    $this->actingAs($pendingRegistrant)
        ->get(route('registrations.online.create'))
        ->assertForbidden();

    $this->actingAs($pendingRegistrant)
        ->post(route('registrations.online.store'), [
            'event_id' => $event->id,
            'payment_reference' => '',
            'receipt' => UploadedFile::fake()->create('receipt.pdf', 256, 'application/pdf'),
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

test('online registrants can edit registrations that are awaiting review or correction', function () {
    Notification::fake();

    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $section = Section::factory()->for($district)->create([
        'name' => 'Section 3',
    ]);
    $pastor = Pastor::factory()->for($section)->create([
        'church_name' => 'UPC',
        'pastor_name' => 'Junar Tongol',
    ]);
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $pastor->id,
    ]);
    $reviewer = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $event = onlineRegistrationEvent();
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
        'slot_limit' => 50,
    ]);
    $oneDayPass = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'One-day Pass',
        'amount' => '600.00',
        'status' => 'inactive',
        'slot_limit' => 10,
    ]);

    Storage::disk('local')->put(
        'registration-receipts/2026/03/original.pdf',
        'original-receipt',
    );

    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->for($registrant, 'receiptUploadedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_NEEDS_CORRECTION,
            'payment_reference' => 'DEP-2026-0099',
            'receipt_file_path' => 'registration-receipts/2026/03/original.pdf',
            'receipt_original_name' => 'original.pdf',
            'receipt_uploaded_at' => now()->subDay(),
            'submitted_at' => now()->subDay(),
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($oneDayPass, 'feeCategory')
        ->create([
            'quantity' => 2,
            'unit_amount' => $oneDayPass->amount,
            'subtotal_amount' => '1200.00',
        ]);

    $registration->reviews()->create([
        'reviewer_user_id' => User::factory()->manager()->create([
            'district_id' => $district->id,
            'section_id' => $section->id,
        ])->id,
        'decision' => Registration::STATUS_NEEDS_CORRECTION,
        'reason' => 'Please upload a clearer proof of payment.',
        'notes' => 'Reference number is still valid.',
        'decided_at' => now()->subHours(12),
    ]);

    $this->actingAs($registrant)
        ->get(route('registrations.online.edit', $registration))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/online/edit')
            ->where('registration.id', $registration->id)
            ->where('registration.latest_review.decision', Registration::STATUS_NEEDS_CORRECTION)
            ->where('registration.latest_review.reason', 'Please upload a clearer proof of payment.')
            ->where('events.0.fee_categories.0.category_name', 'One-day Pass'));

    $this->actingAs($registrant)
        ->patch(route('registrations.online.update', $registration), [
            'event_id' => $event->id,
            'payment_reference' => 'DEP-2026-0100',
            'receipt' => UploadedFile::fake()->create('updated.pdf', 256, 'application/pdf'),
            'remarks' => 'Updated with corrected receipt image.',
            'line_items' => [
                [
                    'fee_category_id' => $regular->id,
                    'quantity' => 4,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.online.index'));

    $registration->refresh()->load('items.feeCategory');

    expect($registration->registration_status)->toBe(Registration::STATUS_PENDING_VERIFICATION)
        ->and($registration->payment_reference)->toBe('DEP-2026-0100')
        ->and($registration->remarks)->toBe('Updated with corrected receipt image.')
        ->and($registration->verified_at)->toBeNull()
        ->and($registration->verified_by_user_id)->toBeNull()
        ->and($registration->items)->toHaveCount(1)
        ->and($registration->items->first()->feeCategory->category_name)->toBe('Regular (Online)')
        ->and($registration->items->first()->quantity)->toBe(4)
        ->and($registration->receipt_original_name)->toBe('updated.pdf')
        ->and($registration->receipt_file_path)->not->toBe('registration-receipts/2026/03/original.pdf');

    Storage::disk('local')->assertMissing('registration-receipts/2026/03/original.pdf');
    Storage::disk('local')->assertExists((string) $registration->receipt_file_path);
    Notification::assertSentTo($reviewer, RegistrationResubmitted::class);
});

test('online registration update rejects capacity overflow while preserving current reserved quantity', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $pastor = Pastor::factory()->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
    ]);
    $event = onlineRegistrationEvent([
        'total_capacity' => 5,
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
        'slot_limit' => 5,
    ]);

    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->for($registrant, 'receiptUploadedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_NEEDS_CORRECTION,
            'payment_reference' => 'DEP-2026-2101',
            'receipt_file_path' => 'registration-receipts/2026/03/capacity-update.pdf',
            'receipt_original_name' => 'capacity-update.pdf',
            'receipt_uploaded_at' => now()->subHour(),
            'submitted_at' => now()->subHour(),
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => 2,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => '1600.00',
        ]);

    $otherRegistration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->for($registrant, 'receiptUploadedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
            'payment_reference' => 'DEP-2026-2102',
            'receipt_file_path' => 'registration-receipts/2026/03/capacity-other.pdf',
            'receipt_original_name' => 'capacity-other.pdf',
            'receipt_uploaded_at' => now()->subHour(),
            'submitted_at' => now()->subHour(),
        ]);

    RegistrationItem::factory()
        ->for($otherRegistration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => 3,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => '2400.00',
        ]);

    $this->actingAs($registrant)
        ->from(route('registrations.online.edit', $registration))
        ->patch(route('registrations.online.update', $registration), [
            'event_id' => $event->id,
            'payment_reference' => 'DEP-2026-2103',
            'remarks' => 'Trying to exceed remaining capacity.',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity' => 3,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.online.edit', $registration))
        ->assertSessionHasErrors([
            'line_items.0.quantity',
            'line_items',
        ]);

    expect((int) $registration->fresh()->items()->sum('quantity'))->toBe(2);
});

test('online registrants can cancel registrations before verification but cannot edit verified registrations', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $pastor = Pastor::factory()->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
    ]);
    $event = onlineRegistrationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);

    $pendingRegistration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->for($registrant, 'receiptUploadedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
            'receipt_file_path' => 'registration-receipts/2026/03/pending.pdf',
            'receipt_original_name' => 'pending.pdf',
            'receipt_uploaded_at' => now()->subHour(),
            'submitted_at' => now()->subHour(),
        ]);

    RegistrationItem::factory()
        ->for($pendingRegistration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => 3,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => '2400.00',
        ]);

    $verifiedRegistration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->for($registrant, 'receiptUploadedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_VERIFIED,
            'receipt_file_path' => 'registration-receipts/2026/03/verified.pdf',
            'receipt_original_name' => 'verified.pdf',
            'receipt_uploaded_at' => now()->subHour(),
            'submitted_at' => now()->subHour(),
            'verified_at' => now()->subMinutes(30),
            'verified_by_user_id' => User::factory()->manager()->create([
                'district_id' => $pastor->section->district_id,
                'section_id' => $pastor->section_id,
            ])->id,
        ]);

    RegistrationItem::factory()
        ->for($verifiedRegistration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => 2,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => '1600.00',
        ]);

    $this->actingAs($registrant)
        ->patch(route('registrations.online.cancel', $pendingRegistration))
        ->assertRedirect(route('registrations.online.index'));

    expect($pendingRegistration->fresh()->registration_status)
        ->toBe(Registration::STATUS_CANCELLED);

    $this->actingAs($registrant)
        ->get(route('registrations.online.edit', $verifiedRegistration))
        ->assertForbidden();

    $this->actingAs($registrant)
        ->patch(route('registrations.online.cancel', $verifiedRegistration))
        ->assertForbidden();
});

test('cancelled online registrations release capacity for a new submission', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $pastor = Pastor::factory()->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
    ]);
    $event = onlineRegistrationEvent([
        'total_capacity' => 2,
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
        'slot_limit' => 2,
    ]);

    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->for($registrant, 'receiptUploadedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
            'payment_reference' => 'DEP-2026-2201',
            'receipt_file_path' => 'registration-receipts/2026/03/cancel-release.pdf',
            'receipt_original_name' => 'cancel-release.pdf',
            'receipt_uploaded_at' => now()->subHour(),
            'submitted_at' => now()->subHour(),
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => 2,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => '1600.00',
        ]);

    $this->actingAs($registrant)
        ->patch(route('registrations.online.cancel', $registration))
        ->assertRedirect(route('registrations.online.index'));

    $this->actingAs($registrant)
        ->post(route('registrations.online.store'), [
            'event_id' => $event->id,
            'payment_reference' => 'DEP-2026-2202',
            'receipt' => UploadedFile::fake()->create('replacement.pdf', 256, 'application/pdf'),
            'remarks' => '',
            'line_items' => [
                [
                    'fee_category_id' => $feeCategory->id,
                    'quantity' => 2,
                ],
            ],
        ])
        ->assertRedirect(route('registrations.online.index'));

    expect(Registration::query()->count())->toBe(2)
        ->and($registration->fresh()->registration_status)->toBe(Registration::STATUS_CANCELLED);
});

function onlineRegistrationEvent(array $attributes = []): Event
{
    return Event::factory()->create([
        'name' => 'CLD Youth Conference 2026',
        'status' => Event::STATUS_OPEN,
        'total_capacity' => 200,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(30),
        ...$attributes,
    ]);
}
