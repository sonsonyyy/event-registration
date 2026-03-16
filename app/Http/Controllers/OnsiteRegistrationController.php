<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexOnsiteRegistrationRequest;
use App\Http\Requests\StoreOnsiteRegistrationRequest;
use App\Http\Requests\UpdateOnsiteRegistrationRequest;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OnsiteRegistrationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexOnsiteRegistrationRequest $request): Response
    {
        Gate::authorize('viewAnyOnsite', Registration::class);

        $user = $request->user();
        $filters = $request->filters();
        $registrations = $this->onsiteRegistrationIndexQuery($user, $filters['search'])
            ->paginate($filters['per_page'])
            ->withQueryString();

        return Inertia::render('registrations/onsite/index', [
            'registrations' => [
                'data' => $registrations->getCollection()
                    ->map(fn (Registration $registration): array => $this->registrationData($registration, $user))
                    ->values()
                    ->all(),
                'meta' => [
                    'current_page' => $registrations->currentPage(),
                    'last_page' => $registrations->lastPage(),
                    'per_page' => $registrations->perPage(),
                    'from' => $registrations->firstItem(),
                    'to' => $registrations->lastItem(),
                    'total' => $registrations->total(),
                ],
            ],
            'filters' => $filters,
            'perPageOptions' => [10, 25, 50],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request): Response
    {
        Gate::authorize('createOnsite', [Registration::class, null]);

        return Inertia::render('registrations/onsite/create', [
            'events' => $this->eventOptions(),
            'pastors' => $this->pastorOptions($request->user()),
        ]);
    }

    public function edit(Request $request, Registration $registration): Response
    {
        Gate::authorize('updateOnsite', $registration);

        $registration = Registration::query()
            ->with([
                'items.feeCategory',
                'pastor.section.district',
            ])
            ->findOrFail($registration->getKey());

        return Inertia::render('registrations/onsite/edit', [
            'events' => $this->eventOptions($registration),
            'pastors' => $this->pastorOptions($request->user()),
            'registration' => $this->editableRegistrationData($registration),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreOnsiteRegistrationRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $registrationId = DB::transaction(function () use ($request, $validated): int {
            $event = Event::query()
                ->lockForUpdate()
                ->findOrFail($validated['event_id']);
            $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');
            $event->syncOperationalStatus();

            if (! $event->canAcceptRegistrations()) {
                throw ValidationException::withMessages([
                    'event_id' => 'The selected event is not open for onsite registration.',
                ]);
            }

            $pastor = Pastor::query()->findOrFail($validated['pastor_id']);
            Gate::authorize('createOnsite', [Registration::class, $pastor]);

            if ($pastor->status !== 'active') {
                throw ValidationException::withMessages([
                    'pastor_id' => 'The selected pastor must be active.',
                ]);
            }

            $lineItems = collect($validated['line_items']);
            $feeCategories = EventFeeCategory::query()
                ->where('event_id', $event->getKey())
                ->whereIn('id', $lineItems->pluck('fee_category_id')->all())
                ->lockForUpdate()
                ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                ->get()
                ->keyBy('id');

            $this->guardLineItems($event, $feeCategories, $lineItems);

            $registration = Registration::query()->create([
                'event_id' => $event->getKey(),
                'pastor_id' => $pastor->getKey(),
                'encoded_by_user_id' => $request->user()->getKey(),
                'registration_mode' => Registration::MODE_ONSITE,
                'payment_status' => Registration::PAYMENT_STATUS_PAID,
                'registration_status' => Registration::STATUS_COMPLETED,
                'payment_reference' => $validated['payment_reference'],
                'remarks' => $validated['remarks'] ?: null,
                'submitted_at' => now(),
                'verified_at' => null,
                'verified_by_user_id' => null,
            ]);

            $this->persistLineItems($registration, $lineItems, $feeCategories);

            return $registration->getKey();
        });

        return to_route('registrations.onsite.index')
            ->with('success', "Onsite registration #{$registrationId} saved successfully.");
    }

    public function update(UpdateOnsiteRegistrationRequest $request, Registration $registration): RedirectResponse
    {
        $validated = $request->validated();

        $registrationId = DB::transaction(function () use ($registration, $validated): int {
            $registration = Registration::query()
                ->with([
                    'items.feeCategory',
                ])
                ->lockForUpdate()
                ->findOrFail($registration->getKey());

            Gate::authorize('updateOnsite', $registration);

            $pastor = Pastor::query()
                ->with('section.district')
                ->findOrFail($validated['pastor_id']);

            if ($pastor->status !== 'active') {
                throw ValidationException::withMessages([
                    'pastor_id' => 'The selected pastor must be active.',
                ]);
            }

            $originalEventId = $registration->event_id;
            $event = Event::query()
                ->lockForUpdate()
                ->findOrFail($validated['event_id']);
            $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');

            if (
                $originalEventId !== $event->getKey()
                && ! $event->canAcceptRegistrations()
            ) {
                throw ValidationException::withMessages([
                    'event_id' => 'The selected event is not open for onsite registration.',
                ]);
            }

            $lineItems = collect($validated['line_items']);
            $feeCategories = EventFeeCategory::query()
                ->where('event_id', $event->getKey())
                ->whereIn('id', $lineItems->pluck('fee_category_id')->all())
                ->lockForUpdate()
                ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                ->get()
                ->keyBy('id');

            $this->guardLineItems($event, $feeCategories, $lineItems, $registration);

            $registration->forceFill([
                'event_id' => $event->getKey(),
                'pastor_id' => $pastor->getKey(),
                'payment_reference' => $validated['payment_reference'],
                'remarks' => $validated['remarks'] ?: null,
            ])->save();

            $registration->items()->delete();
            $this->persistLineItems($registration, $lineItems, $feeCategories);
            $this->syncEventStatuses([$originalEventId, $registration->event_id]);

            return $registration->getKey();
        });

        return to_route('registrations.onsite.index')
            ->with('success', "Onsite registration #{$registrationId} updated successfully.");
    }

    /**
     * Build the event options available to onsite registration users.
     *
     * @return array<int, array<string, mixed>>
     */
    private function eventOptions(?Registration $registration = null): array
    {
        $currentEventId = $registration?->event_id;
        $currentRegistrationQuantity = $registration?->totalQuantity() ?? 0;
        $currentFeeItemQuantities = $registration?->items
            ->mapWithKeys(fn (RegistrationItem $item): array => [
                $item->fee_category_id => (int) $item->quantity,
            ]) ?? collect();
        $currentFeeCategoryIds = $currentFeeItemQuantities->keys()->all();

        return Event::query()
            ->when(
                $currentEventId !== null,
                fn (Builder $query) => $query->where(function (Builder $builder) use ($currentEventId): void {
                    $builder
                        ->where('status', Event::STATUS_OPEN)
                        ->orWhere('id', $currentEventId);
                }),
                fn (Builder $query) => $query->where('status', Event::STATUS_OPEN),
            )
            ->withCapacityMetrics()
            ->with([
                'feeCategories' => fn ($query) => $query
                    ->when(
                        $currentFeeCategoryIds !== [],
                        fn ($feeQuery) => $feeQuery->where(function (Builder $builder) use ($currentFeeCategoryIds): void {
                            $builder
                                ->where('status', 'active')
                                ->orWhereIn('id', $currentFeeCategoryIds);
                        }),
                        fn ($feeQuery) => $feeQuery->where('status', 'active'),
                    )
                    ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                    ->orderBy('category_name'),
            ])
            ->orderBy('date_from')
            ->get()
            ->each(fn (Event $event): bool => $event->syncOperationalStatus())
            ->filter(function (Event $event) use ($currentEventId): bool {
                if ($event->feeCategories->isEmpty()) {
                    return false;
                }

                if ($currentEventId !== null && $event->getKey() === $currentEventId) {
                    return true;
                }

                if (! $event->canAcceptRegistrations()) {
                    return false;
                }

                return $event->feeCategories->contains(function (EventFeeCategory $feeCategory): bool {
                    $remainingSlots = $feeCategory->remainingSlots();

                    return $feeCategory->status === 'active'
                        && ($remainingSlots === null || $remainingSlots > 0);
                });
            })
            ->map(function (Event $event) use (
                $currentEventId,
                $currentRegistrationQuantity,
                $currentFeeItemQuantities,
            ): array {
                $currentEventQuantity = $currentEventId !== null && $event->getKey() === $currentEventId
                    ? $currentRegistrationQuantity
                    : 0;

                return [
                    'id' => $event->getKey(),
                    'name' => $event->name,
                    'venue' => $event->venue,
                    'date_from' => $event->date_from->toDateString(),
                    'date_to' => $event->date_to->toDateString(),
                    'registration_close_at' => $event->registration_close_at->toIso8601String(),
                    'remaining_slots' => $event->remainingSlots() + $currentEventQuantity,
                    'fee_categories' => $event->feeCategories
                        ->filter(function (EventFeeCategory $feeCategory) use ($currentEventId, $event, $currentFeeItemQuantities): bool {
                            $currentQuantity = $currentEventId !== null && $event->getKey() === $currentEventId
                                ? (int) $currentFeeItemQuantities->get($feeCategory->getKey(), 0)
                                : 0;

                            if ($currentQuantity > 0) {
                                return true;
                            }

                            $remainingSlots = $this->availableFeeCategorySlots($feeCategory);

                            return $feeCategory->status === 'active'
                                && ($remainingSlots === null || $remainingSlots > 0);
                        })
                        ->map(function (EventFeeCategory $feeCategory) use ($currentEventId, $event, $currentFeeItemQuantities): array {
                            $currentQuantity = $currentEventId !== null && $event->getKey() === $currentEventId
                                ? (int) $currentFeeItemQuantities->get($feeCategory->getKey(), 0)
                                : 0;

                            return [
                                'id' => $feeCategory->getKey(),
                                'category_name' => $feeCategory->category_name,
                                'amount' => (string) $feeCategory->amount,
                                'slot_limit' => $feeCategory->slot_limit,
                                'remaining_slots' => $this->availableFeeCategorySlots($feeCategory, $currentQuantity),
                                'status' => $feeCategory->status,
                            ];
                        })
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Build the pastor options available to the current user.
     *
     * @return array<int, array<string, mixed>>
     */
    private function pastorOptions(?User $user): array
    {
        $pastors = Pastor::query()
            ->where('status', 'active')
            ->with('section.district')
            ->orderBy('church_name');

        if ($user?->isManager()) {
            $pastors->where('section_id', $user->section_id);
        }

        return $pastors
            ->get()
            ->map(fn (Pastor $pastor): array => [
                'id' => $pastor->getKey(),
                'pastor_name' => $pastor->pastor_name,
                'church_name' => $pastor->church_name,
                'section_id' => $pastor->section->getKey(),
                'section_name' => $pastor->section->name,
                'district_id' => $pastor->section->district->getKey(),
                'district_name' => $pastor->section->district->name,
            ])
            ->values()
            ->all();
    }

    private function availableFeeCategorySlots(EventFeeCategory $feeCategory, int $currentQuantity = 0): ?int
    {
        $remainingSlots = $feeCategory->remainingSlots();

        if ($remainingSlots === null) {
            return null;
        }

        return $remainingSlots + $currentQuantity;
    }

    /**
     * Ensure the selected fee categories still satisfy event and category capacity.
     *
     * @param  Collection<int, EventFeeCategory>  $feeCategories
     * @param  Collection<int, array<string, mixed>>  $lineItems
     */
    private function guardLineItems(
        Event $event,
        Collection $feeCategories,
        Collection $lineItems,
        ?Registration $existingRegistration = null,
    ): void {
        $errors = [];
        $currentFeeItemQuantities = $existingRegistration?->items
            ->mapWithKeys(fn (RegistrationItem $item): array => [
                $item->fee_category_id => (int) $item->quantity,
            ]) ?? collect();
        $currentRegistrationQuantity = $existingRegistration?->totalQuantity() ?? 0;
        $sameEvent = $existingRegistration !== null && $existingRegistration->event_id === $event->getKey();
        $availableEventSlots = $event->remainingSlots() + ($sameEvent ? $currentRegistrationQuantity : 0);
        $totalQuantity = 0;

        $lineItems->each(function (array $lineItem, int $index) use (
            $feeCategories,
            $currentFeeItemQuantities,
            $sameEvent,
            &$errors,
            &$totalQuantity,
        ): void {
            /** @var EventFeeCategory|null $feeCategory */
            $feeCategory = $feeCategories->get((int) $lineItem['fee_category_id']);
            $quantity = (int) $lineItem['quantity'];

            if ($feeCategory === null) {
                $errors["line_items.{$index}.fee_category_id"] = 'Select a valid fee category for the chosen event.';

                return;
            }

            $currentQuantity = $sameEvent
                ? (int) $currentFeeItemQuantities->get($feeCategory->getKey(), 0)
                : 0;

            if ($feeCategory->status !== 'active' && $currentQuantity === 0) {
                $errors["line_items.{$index}.fee_category_id"] = 'The selected fee category is not active.';
            }

            $remainingSlots = $this->availableFeeCategorySlots($feeCategory, $currentQuantity);

            if ($remainingSlots !== null && $quantity > $remainingSlots) {
                $errors["line_items.{$index}.quantity"] = 'The selected fee category does not have enough remaining slots.';
            }

            $totalQuantity += $quantity;
        });

        if ($totalQuantity > $availableEventSlots) {
            $errors['line_items'] = 'The requested quantity exceeds the remaining event capacity.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * Persist the grouped registration line items.
     *
     * @param  Collection<int, array<string, mixed>>  $lineItems
     * @param  Collection<int, EventFeeCategory>  $feeCategories
     */
    private function persistLineItems(Registration $registration, Collection $lineItems, Collection $feeCategories): void
    {
        $lineItems->each(function (array $lineItem) use ($feeCategories, $registration): void {
            /** @var EventFeeCategory $feeCategory */
            $feeCategory = $feeCategories->get((int) $lineItem['fee_category_id']);
            $quantity = (int) $lineItem['quantity'];
            $unitAmount = (string) $feeCategory->amount;

            $registration->items()->create([
                'fee_category_id' => $feeCategory->getKey(),
                'quantity' => $quantity,
                'unit_amount' => $unitAmount,
                'subtotal_amount' => bcmul($unitAmount, (string) $quantity, 2),
                'remarks' => null,
            ]);
        });
    }

    /**
     * Sync event operational status for the affected event IDs.
     *
     * @param  array<int, int|null>  $eventIds
     */
    private function syncEventStatuses(array $eventIds): void
    {
        $uniqueEventIds = collect($eventIds)
            ->filter()
            ->map(fn (mixed $eventId): int => (int) $eventId)
            ->unique()
            ->values();

        Event::query()
            ->whereIn('id', $uniqueEventIds->all())
            ->get()
            ->each(function (Event $event): void {
                $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');
                $event->syncOperationalStatus();
            });
    }

    /**
     * Transform an onsite registration for the index page.
     *
     * @return array<string, mixed>
     */
    private function registrationData(Registration $registration, User $viewer): array
    {
        return [
            'id' => $registration->getKey(),
            'event' => [
                'id' => $registration->event->getKey(),
                'name' => $registration->event->name,
            ],
            'pastor' => [
                'id' => $registration->pastor->getKey(),
                'pastor_name' => $registration->pastor->pastor_name,
                'church_name' => $registration->pastor->church_name,
                'section_name' => $registration->pastor->section->name,
                'district_name' => $registration->pastor->section->district->name,
            ],
            'payment_status' => $registration->payment_status,
            'payment_reference' => $registration->payment_reference,
            'registration_status' => $registration->registration_status,
            'total_quantity' => $registration->totalQuantity(),
            'total_amount' => $registration->totalAmount(),
            'remarks' => $registration->remarks,
            'submitted_at' => $registration->submitted_at?->toIso8601String(),
            'can_edit' => $viewer->can('updateOnsite', $registration),
            'encoded_by' => [
                'id' => $registration->encodedByUser->getKey(),
                'name' => $registration->encodedByUser->name,
            ],
            'items' => $registration->items
                ->map(fn (RegistrationItem $item): array => [
                    'id' => $item->getKey(),
                    'category_name' => $item->feeCategory->category_name,
                    'quantity' => $item->quantity,
                    'unit_amount' => (string) $item->unit_amount,
                    'subtotal_amount' => (string) $item->subtotal_amount,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * Transform an onsite registration for the edit page.
     *
     * @return array<string, mixed>
     */
    private function editableRegistrationData(Registration $registration): array
    {
        return [
            'id' => $registration->getKey(),
            'event_id' => (string) $registration->event_id,
            'pastor_id' => (string) $registration->pastor_id,
            'payment_reference' => $registration->payment_reference,
            'registration_status' => $registration->registration_status,
            'remarks' => $registration->remarks,
            'submitted_at' => $registration->submitted_at?->toIso8601String(),
            'line_items' => $registration->items
                ->map(fn (RegistrationItem $item): array => [
                    'fee_category_id' => (string) $item->fee_category_id,
                    'quantity' => (string) $item->quantity,
                ])
                ->values()
                ->all(),
        ];
    }

    private function onsiteRegistrationIndexQuery(?User $user, string $search): Builder
    {
        $registrations = Registration::query()
            ->where('registration_mode', Registration::MODE_ONSITE)
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('payment_reference', 'like', "%{$search}%")
                        ->orWhere('remarks', 'like', "%{$search}%")
                        ->orWhereHas('event', function (Builder $query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('pastor', function (Builder $query) use ($search): void {
                            $query
                                ->where('church_name', 'like', "%{$search}%")
                                ->orWhere('pastor_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('encodedByUser', function (Builder $query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->with([
                'encodedByUser',
                'event',
                'items.feeCategory',
                'pastor.section.district',
            ])
            ->withSum('items as total_quantity', 'quantity')
            ->withSum('items as total_amount', 'subtotal_amount')
            ->latest('submitted_at')
            ->latest('id');

        if ($user?->isManager()) {
            $registrations->whereHas('pastor', function (Builder $query) use ($user): void {
                $query->where('section_id', $user->section_id);
            });
        }

        if ($user?->isRegistrationStaff()) {
            $registrations->where('encoded_by_user_id', $user->getKey());
        }

        return $registrations;
    }
}
