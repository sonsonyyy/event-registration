<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventFeeCategory;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('welcome', [
            'events' => $this->publicEvents(),
        ]);
    }

    /**
     * Build the public event listing shown on the welcome page.
     *
     * @return array<int, array<string, mixed>>
     */
    private function publicEvents(): array
    {
        return Event::query()
            ->where('status', Event::STATUS_OPEN)
            ->whereHas('feeCategories', function ($query): void {
                $query->where('status', 'active');
            })
            ->withCapacityMetrics()
            ->with([
                'feeCategories' => fn ($query) => $query
                    ->where('status', 'active')
                    ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                    ->orderBy('amount')
                    ->orderBy('category_name'),
            ])
            ->orderBy('date_from')
            ->get()
            ->each(fn (Event $event): bool => $event->syncOperationalStatus())
            ->filter(function (Event $event): bool {
                if (! $event->canAcceptRegistrations()) {
                    return false;
                }

                return $event->feeCategories->contains(function (EventFeeCategory $feeCategory): bool {
                    $remainingSlots = $feeCategory->remainingSlots();

                    return $remainingSlots === null || $remainingSlots > 0;
                });
            })
            ->map(function (Event $event): array {
                return [
                    'id' => $event->getKey(),
                    'name' => $event->name,
                    'description' => $event->description,
                    'venue' => $event->venue,
                    'date_from' => $event->date_from->toDateString(),
                    'date_to' => $event->date_to->toDateString(),
                    'registration_close_at' => $event->registration_close_at->toIso8601String(),
                    'total_capacity' => $event->total_capacity,
                    'remaining_slots' => $event->remainingSlots(),
                    'fee_categories' => $event->feeCategories
                        ->filter(function (EventFeeCategory $feeCategory): bool {
                            $remainingSlots = $feeCategory->remainingSlots();

                            return $remainingSlots === null || $remainingSlots > 0;
                        })
                        ->map(fn (EventFeeCategory $feeCategory): array => [
                            'id' => $feeCategory->getKey(),
                            'category_name' => $feeCategory->category_name,
                            'amount' => (string) $feeCategory->amount,
                            'remaining_slots' => $feeCategory->remainingSlots(),
                        ])
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }
}
