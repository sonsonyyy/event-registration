<?php

namespace App\Support;

use App\Models\Event;
use App\Models\EventFeeCategory;

class EventCapacity
{
    public function reservedQuantityForEvent(Event $event): int
    {
        if (array_key_exists('reserved_quantity', $event->getAttributes())) {
            return (int) $event->getAttribute('reserved_quantity');
        }

        if ($event->relationLoaded('reservedRegistrationItems')) {
            return (int) $event->reservedRegistrationItems->sum('quantity');
        }

        return (int) $event->reservedRegistrationItems()->sum('quantity');
    }

    public function remainingSlotsForEvent(Event $event): int
    {
        return max($event->total_capacity - $this->reservedQuantityForEvent($event), 0);
    }

    public function eventIsFull(Event $event): bool
    {
        return $this->remainingSlotsForEvent($event) === 0;
    }

    public function reservedQuantityForFeeCategory(EventFeeCategory $feeCategory): int
    {
        if (array_key_exists('reserved_quantity', $feeCategory->getAttributes())) {
            return (int) $feeCategory->getAttribute('reserved_quantity');
        }

        if ($feeCategory->relationLoaded('reservedRegistrationItems')) {
            return (int) $feeCategory->reservedRegistrationItems->sum('quantity');
        }

        return (int) $feeCategory->reservedRegistrationItems()->sum('quantity');
    }

    public function remainingSlotsForFeeCategory(EventFeeCategory $feeCategory): ?int
    {
        if ($feeCategory->slot_limit === null) {
            return null;
        }

        return max($feeCategory->slot_limit - $this->reservedQuantityForFeeCategory($feeCategory), 0);
    }

    public function feeCategoryHasCapacity(EventFeeCategory $feeCategory): bool
    {
        $remainingSlots = $this->remainingSlotsForFeeCategory($feeCategory);

        return $remainingSlots === null || $remainingSlots > 0;
    }

    public function eventHasAvailableFeeCategories(Event $event): bool
    {
        $feeCategories = $event->relationLoaded('feeCategories')
            ? $event->feeCategories
            : $event->feeCategories()
                ->where('status', 'active')
                ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                ->get();

        return $feeCategories->contains(function (EventFeeCategory $feeCategory): bool {
            if ($feeCategory->status !== 'active') {
                return false;
            }

            return $this->feeCategoryHasCapacity($feeCategory);
        });
    }
}
