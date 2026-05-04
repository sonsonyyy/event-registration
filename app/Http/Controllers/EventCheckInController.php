<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexEventCheckInRequest;
use App\Http\Requests\StoreEventCheckInRequest;
use App\Models\Event;
use App\Models\EventCheckIn;
use App\Models\EventCheckInItem;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\Section;
use App\Models\User;
use App\Support\DepartmentScopeAccess;
use App\Support\EventCheckInQuantities;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EventCheckInController extends Controller
{
    public function __construct(
        private readonly EventCheckInQuantities $eventCheckInQuantities,
    ) {}

    public function index(IndexEventCheckInRequest $request): Response
    {
        Gate::authorize('viewAny', EventCheckIn::class);

        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $filters = $request->filters();
        $events = $this->eventOptions($user);
        $selectedEvent = $this->selectedEvent($events, $filters['event_id']);
        $sections = $this->sectionOptions($user, $selectedEvent);
        $filters['section_id'] = $this->selectedSectionId(
            $user,
            $selectedEvent,
            $sections,
            $filters['section_id'],
        );
        $workspace = $selectedEvent !== null
            ? $this->workspaceData($user, $selectedEvent, $filters['section_id'])
            : $this->emptyWorkspaceData();
        $filteredChurches = $this->filterChurchRecords(
            $workspace['churches'],
            $filters['search'],
            $filters['claim_status'],
        );
        $churches = $this->paginateChurches(
            $filteredChurches,
            $filters['per_page'],
            (int) $request->input('page', 1),
            $request->url(),
            $request->query(),
        );

        return Inertia::render('event-check-in/index', [
            'scopeSummary' => DepartmentScopeAccess::eventCheckInScopeSummary($user),
            'canFilterBySection' => $this->canFilterBySection($user, $selectedEvent),
            'events' => $events
                ->map(fn (Event $event): array => $this->eventOptionData($event))
                ->values()
                ->all(),
            'sections' => $sections
                ->map(fn (Section $section): array => [
                    'id' => $section->getKey(),
                    'name' => $section->name,
                    'district_name' => $section->district?->name,
                ])
                ->values()
                ->all(),
            'claimStatusOptions' => $this->claimStatusOptions(),
            'filters' => [
                'event_id' => $selectedEvent?->getKey(),
                'section_id' => $filters['section_id'],
                'search' => $filters['search'],
                'claim_status' => $filters['claim_status'],
                'per_page' => $filters['per_page'],
            ],
            'perPageOptions' => [10, 25, 50],
            'selectedEvent' => $selectedEvent !== null
                ? $this->selectedEventData($selectedEvent)
                : null,
            'summary' => $workspace['summary'],
            'feeCategorySummary' => $workspace['fee_category_summary'],
            'churches' => [
                'data' => $churches->getCollection()->all(),
                'meta' => $this->paginationMeta($churches),
            ],
        ]);
    }

    public function store(StoreEventCheckInRequest $request): RedirectResponse
    {
        Gate::authorize('create', [EventCheckIn::class, null]);

        $validated = $request->validated();
        $positiveLineItems = $request->positiveLineItems();

        DB::transaction(function () use ($request, $validated, $positiveLineItems): void {
            $event = Event::query()
                ->lockForUpdate()
                ->findOrFail($validated['event_id']);
            $pastor = Pastor::query()
                ->with('section.district')
                ->lockForUpdate()
                ->findOrFail($validated['pastor_id']);

            Gate::authorize('create', [EventCheckIn::class, $pastor, $event]);

            if ($pastor->status !== 'active') {
                throw ValidationException::withMessages([
                    'pastor_id' => 'The selected church must be active.',
                ]);
            }

            $claimableQuantities = $this->eventCheckInQuantities
                ->claimableCategoryQuantities($event, $pastor);
            $claimedQuantities = $this->eventCheckInQuantities
                ->claimedCategoryQuantities($event, $pastor);
            $feeCategories = $this->eventCheckInQuantities
                ->eventFeeCategories($event);

            if ((int) $claimableQuantities->sum() === 0) {
                throw ValidationException::withMessages([
                    'pastor_id' => 'The selected church has no claimable registrations for this event.',
                ]);
            }

            $eventCheckIn = EventCheckIn::query()->create([
                'event_id' => $event->getKey(),
                'pastor_id' => $pastor->getKey(),
                'checked_in_by_user_id' => $request->user()->getKey(),
                'representative_name' => trim((string) $validated['representative_name']),
                'total_claimed_quantity' => 0,
                'remarks' => filled($validated['remarks']) ? trim((string) $validated['remarks']) : null,
                'checked_in_at' => now(),
            ]);

            $itemsToCreate = [];
            $totalClaimedQuantity = 0;

            foreach ($positiveLineItems as $index => $lineItem) {
                $feeCategoryId = $lineItem['fee_category_id'];
                $quantityClaimed = $lineItem['quantity_claimed'];

                if (! $feeCategories->has($feeCategoryId)) {
                    throw ValidationException::withMessages([
                        "line_items.{$index}.fee_category_id" => 'Select a valid fee category for the chosen event.',
                    ]);
                }

                $remainingQuantity = max(
                    0,
                    (int) $claimableQuantities->get($feeCategoryId, 0)
                        - (int) $claimedQuantities->get($feeCategoryId, 0),
                );

                if ($remainingQuantity === 0) {
                    throw ValidationException::withMessages([
                        "line_items.{$index}.quantity_claimed" => 'No remaining quantity is available for this fee category.',
                    ]);
                }

                if ($quantityClaimed > $remainingQuantity) {
                    throw ValidationException::withMessages([
                        "line_items.{$index}.quantity_claimed" => "Only {$remainingQuantity} remaining quantity is available for this fee category.",
                    ]);
                }

                $itemsToCreate[] = [
                    'fee_category_id' => $feeCategoryId,
                    'quantity_claimed' => $quantityClaimed,
                    'remarks' => $lineItem['remarks'],
                ];
                $totalClaimedQuantity += $quantityClaimed;
            }

            if ($totalClaimedQuantity === 0) {
                throw ValidationException::withMessages([
                    'line_items' => 'Enter at least one fee-category quantity to claim.',
                ]);
            }

            $eventCheckIn->items()->createMany($itemsToCreate);
            $eventCheckIn->forceFill([
                'total_claimed_quantity' => $totalClaimedQuantity,
            ])->save();
        });

        return to_route('event-check-in.index', $request->redirectFilters())
            ->with('success', 'Event check-in saved.');
    }

    /**
     * Fetch the events available for Event Check-in.
     *
     * @return Collection<int, Event>
     */
    private function eventOptions(User $user): Collection
    {
        $query = Event::query()
            ->with([
                'section:id,name,district_id',
                'district:id,name',
                'department:id,name',
            ])
            ->orderByDesc('date_from')
            ->orderByDesc('id');

        DepartmentScopeAccess::scopeAccessibleEvents($query, $user);

        $query->whereHas('registrations', function (Builder $registrationQuery) use ($user): void {
            $registrationQuery
                ->claimableForCheckIn()
                ->whereHas('pastor', function (Builder $pastorQuery) use ($user): void {
                    DepartmentScopeAccess::scopeAccessibleEventCheckInPastors($pastorQuery, $user);
                });
        });

        return $query->get();
    }

    /**
     * @return Collection<int, Section>
     */
    private function sectionOptions(User $user, ?Event $selectedEvent): Collection
    {
        if ($selectedEvent === null) {
            return collect();
        }

        $query = Section::query()
            ->with('district:id,name')
            ->where('status', 'active')
            ->orderBy('name')
            ->orderBy('id');

        if ($selectedEvent->isSectionScoped()) {
            return $query->whereKey($selectedEvent->section_id)->get();
        }

        if ($user->isManager() || ($user->isRegistrationStaff() && $user->section_id !== null)) {
            return $query->whereKey($user->section_id)->get();
        }

        if ($selectedEvent->district_id !== null) {
            return $query->where('district_id', $selectedEvent->district_id)->get();
        }

        return collect();
    }

    private function selectedEvent(Collection $events, ?int $eventId): ?Event
    {
        if ($events->isEmpty()) {
            return null;
        }

        /** @var Event|null $selectedEvent */
        $selectedEvent = $eventId !== null
            ? $events->firstWhere('id', $eventId)
            : null;

        return $selectedEvent ?? $events->first();
    }

    private function selectedSectionId(
        User $user,
        ?Event $selectedEvent,
        Collection $sections,
        ?int $sectionId,
    ): ?int {
        if ($selectedEvent === null) {
            return null;
        }

        if ($selectedEvent->isSectionScoped()) {
            return $selectedEvent->section_id;
        }

        if ($user->isManager() || ($user->isRegistrationStaff() && $user->section_id !== null)) {
            return $user->section_id;
        }

        if ($sectionId === null || ! $sections->contains('id', $sectionId)) {
            return null;
        }

        return $sectionId;
    }

    /**
     * @return array{
     *     summary: array{registered_quantity: int, claimed_quantity: int, remaining_quantity: int, churches_fully_claimed: int, churches_not_claimed: int},
     *     fee_category_summary: array<int, array{id: int, category_name: string, registered_quantity: int, claimed_quantity: int, remaining_quantity: int}>,
     *     churches: Collection<int, array<string, mixed>>
     * }
     */
    private function workspaceData(User $user, Event $event, ?int $sectionId): array
    {
        $pastors = $this->scopedPastorsQuery($user, $event, $sectionId)
            ->whereHas('registrations', function (Builder $registrationQuery) use ($event): void {
                $registrationQuery
                    ->where('event_id', $event->getKey())
                    ->claimableForCheckIn();
            })
            ->get();

        if ($pastors->isEmpty()) {
            return $this->emptyWorkspaceData();
        }

        $pastorIds = $pastors->pluck('id')->all();
        $feeCategories = $this->eventCheckInQuantities->eventFeeCategories($event);
        $registrationsByPastor = Registration::query()
            ->where('event_id', $event->getKey())
            ->whereIn('pastor_id', $pastorIds)
            ->claimableForCheckIn()
            ->with([
                'items.feeCategory',
                'pastor.section.district',
            ])
            ->orderBy('id')
            ->get()
            ->groupBy('pastor_id');
        $checkInsByPastor = EventCheckIn::query()
            ->where('event_id', $event->getKey())
            ->whereIn('pastor_id', $pastorIds)
            ->with([
                'items.feeCategory',
                'checkedInByUser:id,name',
            ])
            ->orderByDesc('checked_in_at')
            ->orderByDesc('id')
            ->get()
            ->groupBy('pastor_id');

        $churches = $pastors
            ->map(function (Pastor $pastor) use ($registrationsByPastor, $checkInsByPastor, $feeCategories): array {
                /** @var Collection<int, Registration> $registrations */
                $registrations = $registrationsByPastor->get($pastor->getKey(), collect());
                /** @var Collection<int, EventCheckIn> $checkIns */
                $checkIns = $checkInsByPastor->get($pastor->getKey(), collect());
                $registrationItems = $registrations->flatMap->items;
                $claimedItems = $checkIns->flatMap->items;
                $registeredByCategory = $registrationItems
                    ->groupBy('fee_category_id')
                    ->map(fn (Collection $items): int => (int) $items->sum('quantity'));
                $claimedByCategory = $claimedItems
                    ->groupBy('fee_category_id')
                    ->map(fn (Collection $items): int => (int) $items->sum('quantity_claimed'));
                $categoryTotals = $feeCategories
                    ->map(function (EventFeeCategory $feeCategory) use ($registeredByCategory, $claimedByCategory): array {
                        $registeredQuantity = (int) $registeredByCategory->get($feeCategory->getKey(), 0);
                        $claimedQuantity = (int) $claimedByCategory->get($feeCategory->getKey(), 0);

                        return [
                            'id' => $feeCategory->getKey(),
                            'category_name' => $feeCategory->category_name,
                            'registered_quantity' => $registeredQuantity,
                            'claimed_quantity' => $claimedQuantity,
                            'remaining_quantity' => max(0, $registeredQuantity - $claimedQuantity),
                        ];
                    })
                    ->filter(fn (array $category): bool => $category['registered_quantity'] > 0 || $category['claimed_quantity'] > 0)
                    ->values();
                $registeredQuantity = (int) $registrationItems->sum('quantity');
                $claimedQuantity = (int) $claimedItems->sum('quantity_claimed');
                $remainingQuantity = max(0, $registeredQuantity - $claimedQuantity);
                $lastClaim = $checkIns->first();

                return [
                    'id' => $pastor->getKey(),
                    'church_name' => $pastor->church_name,
                    'pastor_name' => $pastor->pastor_name,
                    'section_name' => $pastor->section?->name,
                    'district_name' => $pastor->section?->district?->name,
                    'registered_quantity' => $registeredQuantity,
                    'claimed_quantity' => $claimedQuantity,
                    'remaining_quantity' => $remainingQuantity,
                    'claim_status' => $this->claimStatus($registeredQuantity, $claimedQuantity),
                    'last_claim_at' => $lastClaim?->checked_in_at?->toIso8601String(),
                    'category_totals' => $categoryTotals->all(),
                    'claim_history' => $checkIns
                        ->map(fn (EventCheckIn $eventCheckIn): array => $this->claimHistoryData($eventCheckIn))
                        ->values()
                        ->all(),
                ];
            })
            ->sortBy([
                ['church_name', 'asc'],
                ['pastor_name', 'asc'],
                ['id', 'asc'],
            ])
            ->values();

        $registeredQuantity = (int) $churches->sum('registered_quantity');
        $claimedQuantity = (int) $churches->sum('claimed_quantity');

        return [
            'summary' => [
                'registered_quantity' => $registeredQuantity,
                'claimed_quantity' => $claimedQuantity,
                'remaining_quantity' => max(0, $registeredQuantity - $claimedQuantity),
                'churches_fully_claimed' => $churches
                    ->where('claim_status', 'fully claimed')
                    ->count(),
                'churches_not_claimed' => $churches
                    ->where('claim_status', 'not claimed')
                    ->count(),
            ],
            'fee_category_summary' => $feeCategories
                ->map(function (EventFeeCategory $feeCategory) use ($churches): array {
                    $registeredQuantity = (int) $churches->sum(function (array $church) use ($feeCategory): int {
                        $category = collect($church['category_totals'])
                            ->firstWhere('id', $feeCategory->getKey());

                        return (int) ($category['registered_quantity'] ?? 0);
                    });
                    $claimedQuantity = (int) $churches->sum(function (array $church) use ($feeCategory): int {
                        $category = collect($church['category_totals'])
                            ->firstWhere('id', $feeCategory->getKey());

                        return (int) ($category['claimed_quantity'] ?? 0);
                    });

                    return [
                        'id' => $feeCategory->getKey(),
                        'category_name' => $feeCategory->category_name,
                        'registered_quantity' => $registeredQuantity,
                        'claimed_quantity' => $claimedQuantity,
                        'remaining_quantity' => max(0, $registeredQuantity - $claimedQuantity),
                    ];
                })
                ->filter(fn (array $category): bool => $category['registered_quantity'] > 0 || $category['claimed_quantity'] > 0)
                ->values()
                ->all(),
            'churches' => $churches,
        ];
    }

    /**
     * @return array{
     *     summary: array{registered_quantity: int, claimed_quantity: int, remaining_quantity: int, churches_fully_claimed: int, churches_not_claimed: int},
     *     fee_category_summary: array<int, array{id: int, category_name: string, registered_quantity: int, claimed_quantity: int, remaining_quantity: int}>,
     *     churches: Collection<int, array<string, mixed>>
     * }
     */
    private function emptyWorkspaceData(): array
    {
        return [
            'summary' => [
                'registered_quantity' => 0,
                'claimed_quantity' => 0,
                'remaining_quantity' => 0,
                'churches_fully_claimed' => 0,
                'churches_not_claimed' => 0,
            ],
            'fee_category_summary' => [],
            'churches' => collect(),
        ];
    }

    private function scopedPastorsQuery(User $user, Event $event, ?int $sectionId): Builder
    {
        $query = Pastor::query()
            ->with('section.district')
            ->where('status', 'active')
            ->orderBy('church_name')
            ->orderBy('pastor_name')
            ->orderBy('id');

        DepartmentScopeAccess::scopeAccessibleEventCheckInPastors($query, $user);

        if ($event->isSectionScoped()) {
            return $query->where('section_id', $event->section_id);
        }

        if ($sectionId !== null) {
            return $query->where('section_id', $sectionId);
        }

        if ($event->district_id !== null) {
            return $query->whereHas('section', function (Builder $sectionQuery) use ($event): void {
                $sectionQuery->where('district_id', $event->district_id);
            });
        }

        return $query->whereRaw('1 = 0');
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $churches
     * @return Collection<int, array<string, mixed>>
     */
    private function filterChurchRecords(Collection $churches, string $search, string $claimStatus): Collection
    {
        return $churches
            ->when($search !== '', function (Collection $records) use ($search): Collection {
                $normalizedSearch = mb_strtolower($search);

                return $records->filter(function (array $record) use ($normalizedSearch): bool {
                    $searchableText = implode(' ', [
                        $record['church_name'],
                        $record['pastor_name'],
                        $record['section_name'] ?? '',
                        $record['district_name'] ?? '',
                    ]);

                    return str_contains(mb_strtolower($searchableText), $normalizedSearch);
                })->values();
            })
            ->when($claimStatus !== 'all', function (Collection $records) use ($claimStatus): Collection {
                return $records
                    ->where('claim_status', $claimStatus)
                    ->values();
            });
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $churches
     */
    private function paginateChurches(
        Collection $churches,
        int $perPage,
        int $page,
        string $path,
        array $query,
    ): LengthAwarePaginator {
        $currentPage = max(1, $page);
        $total = $churches->count();
        $items = $churches
            ->forPage($currentPage, $perPage)
            ->values();

        return new LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $currentPage,
            [
                'path' => $path,
                'query' => $query,
            ],
        );
    }

    /**
     * @return array{current_page: int, last_page: int, per_page: int, from: int|null, to: int|null, total: int}
     */
    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'total' => $paginator->total(),
        ];
    }

    /**
     * @return array{id: int, name: string, venue: string, date_from: string|null, date_to: string|null, status: string, scope_type: string, district_name: string|null, section_name: string|null, department_name: string|null}
     */
    private function eventOptionData(Event $event): array
    {
        return [
            'id' => $event->getKey(),
            'name' => $event->name,
            'venue' => $event->venue,
            'date_from' => $event->date_from?->toDateString(),
            'date_to' => $event->date_to?->toDateString(),
            'status' => $event->status,
            'scope_type' => $event->scope_type,
            'district_name' => $event->district?->name,
            'section_name' => $event->section?->name,
            'department_name' => $event->department?->name,
        ];
    }

    /**
     * @return array{id: int, name: string, venue: string, description: string|null, date_from: string|null, date_to: string|null, status: string, scope_type: string, district_name: string|null, section_name: string|null, department_name: string|null}
     */
    private function selectedEventData(Event $event): array
    {
        return [
            'id' => $event->getKey(),
            'name' => $event->name,
            'venue' => $event->venue,
            'description' => $event->description,
            'date_from' => $event->date_from?->toDateString(),
            'date_to' => $event->date_to?->toDateString(),
            'status' => $event->status,
            'scope_type' => $event->scope_type,
            'district_name' => $event->district?->name,
            'section_name' => $event->section?->name,
            'department_name' => $event->department?->name,
        ];
    }

    /**
     * @return array{id: int, representative_name: string, total_claimed_quantity: int, remarks: string|null, checked_in_at: string|null, checked_in_by: array{id: int, name: string}|null, items: array<int, array{id: int, category_name: string, quantity_claimed: int, remarks: string|null}>}
     */
    private function claimHistoryData(EventCheckIn $eventCheckIn): array
    {
        return [
            'id' => $eventCheckIn->getKey(),
            'representative_name' => $eventCheckIn->representative_name,
            'total_claimed_quantity' => $eventCheckIn->total_claimed_quantity,
            'remarks' => $eventCheckIn->remarks,
            'checked_in_at' => $eventCheckIn->checked_in_at?->toIso8601String(),
            'checked_in_by' => $eventCheckIn->checkedInByUser ? [
                'id' => $eventCheckIn->checkedInByUser->getKey(),
                'name' => $eventCheckIn->checkedInByUser->name,
            ] : null,
            'items' => $eventCheckIn->items
                ->map(fn (EventCheckInItem $item): array => [
                    'id' => $item->getKey(),
                    'category_name' => $item->feeCategory->category_name,
                    'quantity_claimed' => $item->quantity_claimed,
                    'remarks' => $item->remarks,
                ])
                ->values()
                ->all(),
        ];
    }

    private function claimStatus(int $registeredQuantity, int $claimedQuantity): string
    {
        if ($claimedQuantity <= 0) {
            return 'not claimed';
        }

        if ($claimedQuantity >= $registeredQuantity) {
            return 'fully claimed';
        }

        return 'partially claimed';
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function claimStatusOptions(): array
    {
        return [
            [
                'value' => 'not claimed',
                'label' => 'Not claimed',
            ],
            [
                'value' => 'partially claimed',
                'label' => 'Partially claimed',
            ],
            [
                'value' => 'fully claimed',
                'label' => 'Fully claimed',
            ],
            [
                'value' => 'all',
                'label' => 'All statuses',
            ],
        ];
    }

    private function canFilterBySection(User $user, ?Event $selectedEvent): bool
    {
        if ($selectedEvent === null || $selectedEvent->isSectionScoped()) {
            return false;
        }

        if ($user->isManager()) {
            return false;
        }

        return ! ($user->isRegistrationStaff() && $user->section_id !== null);
    }
}
