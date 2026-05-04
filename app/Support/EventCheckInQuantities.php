<?php

namespace App\Support;

use App\Models\Event;
use App\Models\EventCheckInItem;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use Illuminate\Support\Collection;

class EventCheckInQuantities
{
    /**
     * Get the event fee categories, including soft-deleted historical rows.
     *
     * @return Collection<int, EventFeeCategory>
     */
    public function eventFeeCategories(Event $event): Collection
    {
        return EventFeeCategory::query()
            ->withTrashed()
            ->where('event_id', $event->getKey())
            ->orderBy('id')
            ->get()
            ->keyBy('id');
    }

    /**
     * Get claimable registered quantities by fee category.
     *
     * @return Collection<int, int>
     */
    public function claimableCategoryQuantities(Event $event, Pastor $pastor): Collection
    {
        return RegistrationItem::query()
            ->select('fee_category_id')
            ->selectRaw('SUM(quantity) as total_quantity')
            ->whereHas('registration', function ($query) use ($event, $pastor): void {
                $query
                    ->where('event_id', $event->getKey())
                    ->where('pastor_id', $pastor->getKey())
                    ->claimableForCheckIn();
            })
            ->groupBy('fee_category_id')
            ->get()
            ->mapWithKeys(fn (RegistrationItem $item): array => [
                $item->fee_category_id => (int) $item->total_quantity,
            ]);
    }

    /**
     * Get claimed quantities by fee category.
     *
     * @return Collection<int, int>
     */
    public function claimedCategoryQuantities(Event $event, Pastor $pastor): Collection
    {
        return EventCheckInItem::query()
            ->select('fee_category_id')
            ->selectRaw('SUM(quantity_claimed) as total_quantity_claimed')
            ->whereHas('eventCheckIn', function ($query) use ($event, $pastor): void {
                $query
                    ->where('event_id', $event->getKey())
                    ->where('pastor_id', $pastor->getKey());
            })
            ->groupBy('fee_category_id')
            ->get()
            ->mapWithKeys(fn (EventCheckInItem $item): array => [
                $item->fee_category_id => (int) $item->total_quantity_claimed,
            ]);
    }

    /**
     * Get the claimable registrations used to assemble workspace rows.
     *
     * @return Collection<int, Registration>
     */
    public function claimableRegistrations(Event $event, Pastor $pastor): Collection
    {
        return Registration::query()
            ->where('event_id', $event->getKey())
            ->where('pastor_id', $pastor->getKey())
            ->claimableForCheckIn()
            ->with(['items.feeCategory'])
            ->orderBy('id')
            ->get();
    }
}
