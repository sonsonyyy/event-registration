<?php

use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Support\EventCapacity;

test('event capacity only counts registration statuses that reserve slots', function () {
    $event = Event::factory()->create([
        'status' => Event::STATUS_OPEN,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(5),
        'total_capacity' => 20,
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'slot_limit' => 15,
        'status' => 'active',
    ]);

    reserveCapacityForStatus($event, $feeCategory, Registration::STATUS_SUBMITTED, 2);
    reserveCapacityForStatus($event, $feeCategory, Registration::STATUS_PENDING_VERIFICATION, 4);
    reserveCapacityForStatus($event, $feeCategory, Registration::STATUS_NEEDS_CORRECTION, 3);
    reserveCapacityForStatus($event, $feeCategory, Registration::STATUS_VERIFIED, 2);
    reserveCapacityForStatus($event, $feeCategory, Registration::STATUS_COMPLETED, 1);
    reserveCapacityForStatus($event, $feeCategory, Registration::STATUS_REJECTED, 5);
    reserveCapacityForStatus($event, $feeCategory, Registration::STATUS_CANCELLED, 6);
    reserveCapacityForStatus($event, $feeCategory, Registration::STATUS_DRAFT, 7);

    $eventWithMetrics = Event::query()
        ->withCapacityMetrics()
        ->findOrFail($event->id);
    $feeCategoryWithMetrics = EventFeeCategory::query()
        ->whereKey($feeCategory->id)
        ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
        ->firstOrFail();
    $capacity = app(EventCapacity::class);

    expect($capacity->reservedQuantityForEvent($event))->toBe(12)
        ->and($capacity->reservedQuantityForEvent($eventWithMetrics))->toBe(12)
        ->and($capacity->remainingSlotsForEvent($event))->toBe(8)
        ->and($capacity->remainingSlotsForEvent($eventWithMetrics))->toBe(8)
        ->and($capacity->reservedQuantityForFeeCategory($feeCategory))->toBe(12)
        ->and($capacity->reservedQuantityForFeeCategory($feeCategoryWithMetrics))->toBe(12)
        ->and($capacity->remainingSlotsForFeeCategory($feeCategory))->toBe(3)
        ->and($capacity->remainingSlotsForFeeCategory($feeCategoryWithMetrics))->toBe(3)
        ->and($event->reservedQuantity())->toBe(12)
        ->and($event->remainingSlots())->toBe(8)
        ->and($feeCategory->reservedQuantity())->toBe(12)
        ->and($feeCategory->remainingSlots())->toBe(3);
});

test('event capacity keeps unlimited fee categories available', function () {
    $event = Event::factory()->create([
        'status' => Event::STATUS_OPEN,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(5),
        'total_capacity' => 8,
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'slot_limit' => null,
        'status' => 'active',
    ]);

    reserveCapacityForStatus($event, $feeCategory, Registration::STATUS_PENDING_VERIFICATION, 3);

    $capacity = app(EventCapacity::class);

    expect($capacity->remainingSlotsForEvent($event))->toBe(5)
        ->and($capacity->remainingSlotsForFeeCategory($feeCategory))->toBeNull()
        ->and($capacity->feeCategoryHasCapacity($feeCategory))->toBeTrue()
        ->and($capacity->eventHasAvailableFeeCategories($event))->toBeTrue();
});

function reserveCapacityForStatus(Event $event, EventFeeCategory $feeCategory, string $status, int $quantity): void
{
    $registration = Registration::factory()->create([
        'event_id' => $event->id,
        'registration_status' => $status,
    ]);

    RegistrationItem::factory()->create([
        'registration_id' => $registration->id,
        'fee_category_id' => $feeCategory->id,
        'quantity' => $quantity,
        'unit_amount' => '800.00',
        'subtotal_amount' => $quantity * 800,
    ]);
}
