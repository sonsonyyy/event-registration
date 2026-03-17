<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexEventRequest;
use App\Http\Requests\Admin\StoreEventRequest;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Models\Event;
use App\Models\EventFeeCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexEventRequest $request): Response
    {
        $filters = $request->filters();

        $events = Event::query()
            ->when($filters['search'] !== '', function (Builder $query) use ($filters): void {
                $search = $filters['search'];

                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('venue', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->withCapacityMetrics()
            ->orderByDesc('date_from')
            ->paginate($filters['per_page'])
            ->withQueryString();

        $events->getCollection()
            ->each(fn (Event $event): bool => $event->syncOperationalStatus());

        return Inertia::render('admin/events/index', [
            'events' => [
                'data' => $events->getCollection()
                    ->map(fn (Event $event): array => $this->eventIndexData($event))
                    ->values()
                    ->all(),
                'meta' => [
                    'current_page' => $events->currentPage(),
                    'last_page' => $events->lastPage(),
                    'per_page' => $events->perPage(),
                    'from' => $events->firstItem(),
                    'to' => $events->lastItem(),
                    'total' => $events->total(),
                ],
            ],
            'filters' => $filters,
            'perPageOptions' => [10, 25, 50],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('admin/events/create', [
            'statusOptions' => $this->eventStatusOptions(),
            'feeCategoryStatusOptions' => $this->feeCategoryStatusOptions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEventRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $feeCategories = collect($validated['fee_categories']);
        unset($validated['fee_categories']);

        DB::transaction(function () use ($validated, $feeCategories): void {
            $event = Event::query()->create($validated);

            $this->syncFeeCategories($event, $feeCategories);
            $event->syncOperationalStatus();
        });

        return to_route('admin.events.index')->with('success', 'Event created.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Event $event): Response
    {
        Gate::authorize('update', $event);

        $event->load([
            'feeCategories' => fn ($query) => $query
                ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                ->orderBy('id'),
        ]);
        $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');
        $event->syncOperationalStatus();

        return Inertia::render('admin/events/edit', [
            'event' => $this->eventFormData($event),
            'statusOptions' => $this->eventStatusOptions(),
            'feeCategoryStatusOptions' => $this->feeCategoryStatusOptions(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $validated = $request->validated();
        $feeCategories = collect($validated['fee_categories']);
        unset($validated['fee_categories']);

        DB::transaction(function () use ($event, $validated, $feeCategories): void {
            $event->update($validated);

            $this->syncFeeCategories($event, $feeCategories);
            $event->syncOperationalStatus();
        });

        return to_route('admin.events.index')->with('success', 'Event updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Event $event): RedirectResponse
    {
        Gate::authorize('delete', $event);

        if ($event->registrations()->exists()) {
            return to_route('admin.events.index')->with(
                'error',
                'Event has registrations and cannot be deleted.',
            );
        }

        $event->delete();

        return to_route('admin.events.index')->with('success', 'Event deleted.');
    }

    /**
     * Synchronize nested fee categories for the given event.
     *
     * @param  Collection<int, array<string, mixed>>  $feeCategories
     */
    private function syncFeeCategories(Event $event, Collection $feeCategories): void
    {
        $existingFeeCategories = $event->feeCategories()->get()->keyBy('id');
        $retainedIds = [];

        $feeCategories->each(function (array $feeCategory) use ($event, $existingFeeCategories, &$retainedIds): void {
            $payload = [
                'category_name' => $feeCategory['category_name'],
                'amount' => $feeCategory['amount'],
                'slot_limit' => $feeCategory['slot_limit'] ?? null,
                'status' => $feeCategory['status'],
            ];

            $feeCategoryId = isset($feeCategory['id']) ? (int) $feeCategory['id'] : null;

            if ($feeCategoryId !== null && $existingFeeCategories->has($feeCategoryId)) {
                $existingFeeCategories[$feeCategoryId]->update($payload);
                $retainedIds[] = $feeCategoryId;

                return;
            }

            $createdFeeCategory = $event->feeCategories()->create($payload);
            $retainedIds[] = $createdFeeCategory->getKey();
        });

        $event->feeCategories()
            ->whereNotIn('id', $retainedIds)
            ->delete();
    }

    /**
     * Transform an event for the list page.
     *
     * @return array<string, mixed>
     */
    private function eventIndexData(Event $event): array
    {
        return [
            'id' => $event->id,
            'name' => $event->name,
            'description' => $event->description,
            'venue' => $event->venue,
            'date_from' => $event->date_from->toDateString(),
            'date_to' => $event->date_to->toDateString(),
            'registration_open_at' => $event->registration_open_at->toIso8601String(),
            'registration_close_at' => $event->registration_close_at->toIso8601String(),
            'status' => $event->resolvedStatus(),
            'status_reason' => $event->statusReason(),
            'fee_categories_count' => $event->fee_categories_count,
            'registrations_count' => $event->registrations_count,
            'reserved_quantity' => $event->reservedQuantity(),
            'total_capacity' => $event->total_capacity,
            'remaining_slots' => $event->remainingSlots(),
            'accepting_registrations' => $event->canAcceptRegistrations(),
            'can_delete' => (int) $event->registrations_count === 0,
        ];
    }

    /**
     * Transform an event for the create and edit form pages.
     *
     * @return array<string, mixed>
     */
    private function eventFormData(Event $event): array
    {
        return [
            'id' => $event->id,
            'name' => $event->name,
            'description' => $event->description,
            'venue' => $event->venue,
            'date_from' => $event->date_from->toDateString(),
            'date_to' => $event->date_to->toDateString(),
            'registration_open_at' => $event->registration_open_at->format('Y-m-d\TH:i'),
            'registration_close_at' => $event->registration_close_at->format('Y-m-d\TH:i'),
            'status' => $event->status,
            'total_capacity' => $event->total_capacity,
            'reserved_quantity' => $event->reservedQuantity(),
            'remaining_slots' => $event->remainingSlots(),
            'status_reason' => $event->statusReason(),
            'accepting_registrations' => $event->canAcceptRegistrations(),
            'fee_categories' => $event->feeCategories->map(
                fn (EventFeeCategory $feeCategory): array => [
                    'id' => $feeCategory->id,
                    'category_name' => $feeCategory->category_name,
                    'amount' => (string) $feeCategory->amount,
                    'slot_limit' => $feeCategory->slot_limit,
                    'status' => $feeCategory->status,
                    'reserved_quantity' => $feeCategory->reservedQuantity(),
                    'remaining_slots' => $feeCategory->remainingSlots(),
                ],
            )->values(),
        ];
    }

    /**
     * Build the supported event status options.
     *
     * @return array<int, array<string, string>>
     */
    private function eventStatusOptions(): array
    {
        return [
            ['value' => Event::STATUS_DRAFT, 'label' => 'Draft'],
            ['value' => Event::STATUS_OPEN, 'label' => 'Open'],
            ['value' => Event::STATUS_CLOSED, 'label' => 'Closed'],
            ['value' => Event::STATUS_COMPLETED, 'label' => 'Completed'],
            ['value' => Event::STATUS_CANCELLED, 'label' => 'Cancelled'],
        ];
    }

    /**
     * Build the supported fee category status options.
     *
     * @return array<int, array<string, string>>
     */
    private function feeCategoryStatusOptions(): array
    {
        return [
            ['value' => 'active', 'label' => 'Active'],
            ['value' => 'inactive', 'label' => 'Inactive'],
        ];
    }
}
