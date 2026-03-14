<?php

use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\Section;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('online registrants can submit registrations with receipt upload stored on the configured disk', function () {
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
        ->assertRedirect(route('registrations.online.index'));

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
            ->where('registrations.data.0.registration_status', Registration::STATUS_PENDING_VERIFICATION)
            ->where('registrations.data.0.total_quantity', 6)
            ->where('registrations.data.0.receipt.original_name', 'receipt.pdf'));
});

test('online registrations can store receipts on s3 when the configured disk uses s3', function () {
    Storage::fake('s3');
    config()->set('registration.receipts_disk', 's3');

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
            'payment_reference' => '',
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
