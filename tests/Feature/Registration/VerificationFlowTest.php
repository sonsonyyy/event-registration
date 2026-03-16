<?php

use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Section;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('managers can view a verification queue scoped to their assigned section', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $assignedSection = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $otherSection = Section::factory()->for($district)->create([
        'name' => 'Section 2',
    ]);
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $assignedSection->id,
    ]);
    $event = verificationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
        'slot_limit' => 20,
    ]);
    $assignedPastor = Pastor::factory()->for($assignedSection)->create([
        'church_name' => 'Grace Community Church',
        'pastor_name' => 'Pastor Jane Doe',
    ]);
    $otherPastor = Pastor::factory()->for($otherSection)->create([
        'church_name' => 'Northside Church',
        'pastor_name' => 'Pastor John Roe',
    ]);
    $assignedRegistrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $assignedSection->id,
        'pastor_id' => $assignedPastor->id,
    ]);
    $otherRegistrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $otherSection->id,
        'pastor_id' => $otherPastor->id,
    ]);

    createOnlineRegistrationForVerification(
        $event,
        $assignedPastor,
        $assignedRegistrant,
        $feeCategory,
        [
            'payment_reference' => 'DEP-CLD-1001',
        ],
    );

    createOnlineRegistrationForVerification(
        $event,
        $assignedPastor,
        $assignedRegistrant,
        $feeCategory,
        [
            'registration_status' => Registration::STATUS_VERIFIED,
            'verified_at' => now()->subHour(),
            'verified_by_user_id' => $manager->id,
            'payment_reference' => 'DEP-CLD-1002',
        ],
    );

    createOnlineRegistrationForVerification(
        $event,
        $otherPastor,
        $otherRegistrant,
        $feeCategory,
        [
            'payment_reference' => 'DEP-CLD-2001',
        ],
    );

    $this->actingAs($manager)
        ->get(route('registrations.verification.index', [
            'status' => 'all',
            'search' => 'Grace Community',
            'per_page' => 10,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/verification/index')
            ->where('scopeSummary', 'Central Luzon • Section 1')
            ->where('filters.status', 'all')
            ->where('filters.search', 'Grace Community')
            ->where('summary.pending_verification', 1)
            ->where('summary.needs_correction', 0)
            ->where('summary.verified', 1)
            ->where('summary.rejected', 0)
            ->has('statusOptions', 5)
            ->has('registrations.data', 2)
            ->where('registrations.data.0.pastor.church_name', 'Grace Community Church')
            ->where('registrations.data.1.registration_status', Registration::STATUS_VERIFIED));
});

test('admins can open uploaded receipts and verify online registrations', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $admin = User::factory()->admin()->create();
    $event = verificationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);
    $pastor = Pastor::factory()->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
    ]);
    $receiptPath = 'registration-receipts/2026/03/receipt-admin.pdf';

    Storage::disk('local')->put($receiptPath, 'receipt-content');

    $registration = createOnlineRegistrationForVerification(
        $event,
        $pastor,
        $registrant,
        $feeCategory,
        [
            'receipt_file_path' => $receiptPath,
            'receipt_original_name' => 'receipt-admin.pdf',
        ],
    );

    $this->actingAs($admin)
        ->get(route('registrations.verification.receipt', $registration))
        ->assertSuccessful();

    $this->actingAs($admin)
        ->from(route('registrations.verification.index'))
        ->patch(route('registrations.verification.update', $registration), [
            'decision' => Registration::STATUS_VERIFIED,
        ])
        ->assertRedirect(route('registrations.verification.index'));

    $registration->refresh();

    expect($registration->registration_status)->toBe(Registration::STATUS_VERIFIED)
        ->and($registration->verified_by_user_id)->toBe($admin->id)
        ->and($registration->verified_at)->not->toBeNull();
});

test('reviewers can return registrations for correction with a reason and reviewer notes', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);
    $event = verificationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);
    $pastor = Pastor::factory()->for($section)->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
    ]);

    $registration = createOnlineRegistrationForVerification(
        $event,
        $pastor,
        $registrant,
        $feeCategory,
        [
            'receipt_file_path' => 'registration-receipts/2026/03/correction.pdf',
            'receipt_original_name' => 'correction.pdf',
        ],
    );

    Storage::disk('local')->put(
        'registration-receipts/2026/03/correction.pdf',
        'correction-receipt',
    );

    $this->actingAs($manager)
        ->from(route('registrations.verification.index'))
        ->patch(route('registrations.verification.update', $registration), [
            'decision' => Registration::STATUS_NEEDS_CORRECTION,
            'review_reason' => 'The uploaded receipt is blurred.',
            'review_notes' => 'Ask the church to upload a clearer file before the cutoff.',
        ])
        ->assertRedirect(route('registrations.verification.index'));

    $registration->refresh()->load('reviews.reviewer');

    expect($registration->registration_status)->toBe(Registration::STATUS_NEEDS_CORRECTION)
        ->and($registration->verified_at)->toBeNull()
        ->and($registration->verified_by_user_id)->toBeNull()
        ->and($registration->reviews)->toHaveCount(1)
        ->and($registration->reviews->first()->decision)->toBe(Registration::STATUS_NEEDS_CORRECTION)
        ->and($registration->reviews->first()->reason)->toBe('The uploaded receipt is blurred.')
        ->and($registration->reviews->first()->notes)->toBe('Ask the church to upload a clearer file before the cutoff.')
        ->and($registration->reviews->first()->reviewer?->is($manager))->toBeTrue();
});

test('reviewers must provide a reason when returning registrations for correction or rejecting them', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);
    $event = verificationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create();
    $pastor = Pastor::factory()->for($section)->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
    ]);

    $registration = createOnlineRegistrationForVerification(
        $event,
        $pastor,
        $registrant,
        $feeCategory,
        [
            'receipt_file_path' => 'registration-receipts/2026/03/reason-required.pdf',
            'receipt_original_name' => 'reason-required.pdf',
        ],
    );

    Storage::disk('local')->put(
        'registration-receipts/2026/03/reason-required.pdf',
        'reason-required-receipt',
    );

    $this->actingAs($manager)
        ->from(route('registrations.verification.index'))
        ->patch(route('registrations.verification.update', $registration), [
            'decision' => Registration::STATUS_NEEDS_CORRECTION,
            'review_reason' => '',
            'review_notes' => '',
        ])
        ->assertRedirect(route('registrations.verification.index'))
        ->assertSessionHasErrors('review_reason');

    expect($registration->fresh()->registration_status)
        ->toBe(Registration::STATUS_PENDING_VERIFICATION);
});

test('managers cannot review registrations outside their assigned section', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $district = District::factory()->create();
    $assignedSection = Section::factory()->for($district)->create();
    $otherSection = Section::factory()->for($district)->create();
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $assignedSection->id,
    ]);
    $event = verificationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);
    $outsidePastor = Pastor::factory()->for($otherSection)->create();
    $outsideRegistrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $otherSection->id,
        'pastor_id' => $outsidePastor->id,
    ]);
    $receiptPath = 'registration-receipts/2026/03/outside.pdf';

    Storage::disk('local')->put($receiptPath, 'outside-receipt');

    $registration = createOnlineRegistrationForVerification(
        $event,
        $outsidePastor,
        $outsideRegistrant,
        $feeCategory,
        [
            'receipt_file_path' => $receiptPath,
            'receipt_original_name' => 'outside.pdf',
        ],
    );

    $this->actingAs($manager)
        ->get(route('registrations.verification.receipt', $registration))
        ->assertForbidden();

    $this->actingAs($manager)
        ->patch(route('registrations.verification.update', $registration), [
            'decision' => Registration::STATUS_REJECTED,
        ])
        ->assertForbidden();

    expect($registration->fresh()->registration_status)
        ->toBe(Registration::STATUS_PENDING_VERIFICATION);
});

test('rejected registrations cannot be reviewed again', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');

    $admin = User::factory()->admin()->create();
    $event = verificationEvent();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);
    $pastor = Pastor::factory()->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
    ]);

    $rejectedRegistration = createOnlineRegistrationForVerification(
        $event,
        $pastor,
        $registrant,
        $feeCategory,
        [
            'registration_status' => Registration::STATUS_REJECTED,
            'verified_at' => null,
            'verified_by_user_id' => null,
            'receipt_file_path' => 'registration-receipts/2026/03/rejected.pdf',
            'receipt_original_name' => 'rejected.pdf',
        ],
        1,
    );

    Storage::disk('local')->put(
        (string) $rejectedRegistration->receipt_file_path,
        'rejected-receipt',
    );

    $this->actingAs($admin)
        ->from(route('registrations.verification.index', [
            'status' => 'all',
        ]))
        ->patch(route('registrations.verification.update', $rejectedRegistration), [
            'decision' => Registration::STATUS_VERIFIED,
        ])
        ->assertRedirect(route('registrations.verification.index', [
            'status' => 'all',
        ]))
        ->assertSessionHasErrors('decision');

    expect($rejectedRegistration->fresh()->registration_status)
        ->toBe(Registration::STATUS_REJECTED)
        ->and($rejectedRegistration->fresh()->verified_at)->toBeNull()
        ->and($rejectedRegistration->fresh()->verified_by_user_id)->toBeNull();
});

function verificationEvent(array $attributes = []): Event
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

function createOnlineRegistrationForVerification(
    Event $event,
    Pastor $pastor,
    User $encodedByUser,
    EventFeeCategory $feeCategory,
    array $attributes = [],
    int $quantity = 1,
): Registration {
    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($encodedByUser, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
            'payment_reference' => 'DEP-2026-0001',
            'receipt_file_path' => 'registration-receipts/2026/03/receipt.pdf',
            'receipt_original_name' => 'receipt.pdf',
            'receipt_uploaded_at' => now()->subHour(),
            'receipt_uploaded_by_user_id' => $encodedByUser->id,
            'remarks' => 'Uploaded by church treasurer.',
            'submitted_at' => now()->subHour(),
            ...$attributes,
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => $quantity,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => number_format((float) $feeCategory->amount * $quantity, 2, '.', ''),
            'remarks' => null,
        ]);

    return $registration->refresh();
}
