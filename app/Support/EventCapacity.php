<?php

namespace App\Support;

use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Registration;
use App\Models\RegistrationItem;
use Illuminate\Support\Collection;

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

    public function availableSlotsForEvent(Event $event, ?Registration $existingRegistration = null): int
    {
        $currentQuantity = 0;

        if (
            $existingRegistration instanceof Registration
            && $existingRegistration->event_id === $event->getKey()
        ) {
            $currentQuantity = $existingRegistration->totalQuantity();
        }

        return $this->remainingSlotsForEvent($event) + $currentQuantity;
    }

    public function availableSlotsForFeeCategory(EventFeeCategory $feeCategory, int $currentQuantity = 0): ?int
    {
        $remainingSlots = $this->remainingSlotsForFeeCategory($feeCategory);

        if ($remainingSlots === null) {
            return null;
        }

        return $remainingSlots + $currentQuantity;
    }

    /**
     * @param  Collection<int, EventFeeCategory>  $feeCategories
     * @param  Collection<int, array<string, mixed>>  $lineItems
     * @return array<string, string>
     */
    public function lineItemErrors(
        Event $event,
        Collection $feeCategories,
        Collection $lineItems,
        ?Registration $existingRegistration = null,
    ): array {
        $errors = [];
        $currentFeeItemQuantities = $this->currentFeeItemQuantities($event, $existingRegistration);
        $availableEventSlots = $this->availableSlotsForEvent($event, $existingRegistration);
        $totalQuantity = 0;

        $lineItems->each(function (array $lineItem, int $index) use (
            $feeCategories,
            $currentFeeItemQuantities,
            &$errors,
            &$totalQuantity,
        ): void {
            $feeCategoryId = (int) ($lineItem['fee_category_id'] ?? 0);
            $quantity = (int) ($lineItem['quantity'] ?? 0);

            if ($feeCategoryId === 0 || $quantity === 0) {
                return;
            }

            /** @var EventFeeCategory|null $feeCategory */
            $feeCategory = $feeCategories->get($feeCategoryId);

            if ($feeCategory === null) {
                $errors["line_items.{$index}.fee_category_id"] = 'Select a valid fee category for the chosen event.';

                return;
            }

            $currentQuantity = (int) $currentFeeItemQuantities->get($feeCategory->getKey(), 0);

            if ($feeCategory->status !== 'active' && $currentQuantity === 0) {
                $errors["line_items.{$index}.fee_category_id"] = 'The selected fee category is not active.';
            }

            $availableSlots = $this->availableSlotsForFeeCategory($feeCategory, $currentQuantity);

            if ($availableSlots !== null && $quantity > $availableSlots) {
                $errors["line_items.{$index}.quantity"] = 'The selected fee category does not have enough remaining slots.';
            }

            $totalQuantity += $quantity;
        });

        if ($totalQuantity > $availableEventSlots) {
            $errors['line_items'] = 'The requested quantity exceeds the remaining event capacity.';
        }

        return $errors;
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

    /**
     * @return Collection<int, int>
     */
    private function currentFeeItemQuantities(Event $event, ?Registration $existingRegistration): Collection
    {
        if (
            ! $existingRegistration instanceof Registration
            || $existingRegistration->event_id !== $event->getKey()
        ) {
            return collect();
        }

        $items = $existingRegistration->relationLoaded('items')
            ? $existingRegistration->items
            : $existingRegistration->items()->get();

        return $items->mapWithKeys(fn (RegistrationItem $item): array => [
            $item->fee_category_id => (int) $item->quantity,
        ]);
    }
}
