<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexEventRequest;
use App\Http\Requests\Admin\StoreEventRequest;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Models\Department;
use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Section;
use App\Models\User;
use App\Support\DepartmentScopeAccess;
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

        $events = DepartmentScopeAccess::scopeManageableEvents(Event::query(), $request->user())
            ->when($filters['search'] !== '', function (Builder $query) use ($filters): void {
                $search = $filters['search'];

                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('venue', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->with([
                'district:id,name',
                'section:id,name',
                'department:id,name',
            ])
            ->withCapacityMetrics()
            ->orderByDesc('date_from')
            ->orderByDesc('id')
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
        Gate::authorize('create', Event::class);

        /** @var User|null $actor */
        $actor = auth()->user();

        return Inertia::render('admin/events/create', [
            'statusOptions' => $this->eventStatusOptions(),
            'scopeTypeOptions' => $this->scopeTypeOptions($actor),
            'districts' => $this->districtOptions($actor),
            'sections' => $this->sectionOptions($actor),
            'departments' => $this->departmentOptions($actor),
            'formDefaults' => $this->formDefaults($actor),
            'feeCategoryStatusOptions' => $this->feeCategoryStatusOptions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEventRequest $request): RedirectResponse
    {
        $validated = $request->eventData();
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

        /** @var User|null $actor */
        $actor = auth()->user();

        $event->load([
            'district:id,name',
            'section:id,name',
            'department:id,name',
            'feeCategories' => fn ($query) => $query
                ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                ->orderBy('id'),
        ]);
        $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');
        $event->syncOperationalStatus();

        return Inertia::render('admin/events/edit', [
            'event' => $this->eventFormData($event),
            'statusOptions' => $this->eventStatusOptions(),
            'scopeTypeOptions' => $this->scopeTypeOptions($actor),
            'districts' => $this->districtOptions($actor),
            'sections' => $this->sectionOptions($actor),
            'departments' => $this->departmentOptions($actor),
            'formDefaults' => $this->formDefaults($actor),
            'feeCategoryStatusOptions' => $this->feeCategoryStatusOptions(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $validated = $request->eventData();
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

        $event->delete();

        return to_route('admin.events.index')->with('success', 'Event archived.');
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
            'scope_summary' => $this->eventScopeSummary($event),
            'status_reason' => $event->statusReason(),
            'fee_categories_count' => $event->fee_categories_count,
            'registrations_count' => $event->registrations_count,
            'reserved_quantity' => $event->reservedQuantity(),
            'total_capacity' => $event->total_capacity,
            'remaining_slots' => $event->remainingSlots(),
            'accepting_registrations' => $event->canAcceptRegistrations(),
            'can_delete' => true,
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
            'scope_type' => $event->scope_type,
            'district_id' => $event->district_id,
            'section_id' => $event->section_id,
            'department_id' => $event->department_id,
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
     * @return array<int, array<string, string>>
     */
    private function scopeTypeOptions($user): array
    {
        if ($user?->isAdmin()) {
            return [
                ['value' => Event::SCOPE_DISTRICT, 'label' => 'District-wide'],
            ];
        }

        if ($user?->isManager()) {
            return [
                ['value' => Event::SCOPE_SECTION, 'label' => 'Sectional'],
            ];
        }

        return [
            ['value' => Event::SCOPE_DISTRICT, 'label' => 'District-wide'],
            ['value' => Event::SCOPE_SECTION, 'label' => 'Sectional'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function districtOptions($user): array
    {
        $query = District::query()
            ->orderBy('name');

        if ($user?->isAdmin() && $user->district_id !== null) {
            $query->whereKey($user->district_id);
        } elseif ($user?->isManager()) {
            $districtId = $user->district_id ?? $user->section?->district_id ?? $user->section()->value('district_id');

            if ($districtId === null) {
                return [];
            }

            $query->whereKey($districtId);
        }

        return $query
            ->get()
            ->map(fn (District $district): array => [
                'id' => $district->id,
                'name' => $district->name,
                'status' => $district->status,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function sectionOptions($user): array
    {
        $query = Section::query()
            ->with('district:id,name')
            ->orderBy('name');

        if ($user?->isManager() && $user->section_id !== null) {
            $query->whereKey($user->section_id);
        } elseif ($user?->isAdmin() && $user->district_id !== null) {
            $query->where('district_id', $user->district_id);
        }

        return $query
            ->get()
            ->map(fn (Section $section): array => [
                'id' => $section->id,
                'name' => $section->name,
                'district_id' => $section->district_id,
                'district_name' => $section->district->name,
                'status' => $section->status,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function departmentOptions($user): array
    {
        $query = Department::query()
            ->orderBy('name')
            ->when(
                $user !== null && ! $user->isSuperAdmin() && $user->department_id !== null,
                fn (Builder $query) => $query->whereKey($user->department_id),
            );

        if ($user !== null && ! $user->isSuperAdmin() && $user->department_id === null) {
            return [];
        }

        return $query
            ->get()
            ->map(fn (Department $department): array => [
                'id' => $department->id,
                'name' => $department->name,
                'status' => $department->status,
            ])
            ->values()
            ->all();
    }

    private function eventScopeSummary(Event $event): string
    {
        $scopeParts = [
            $event->district?->name ?? 'Unassigned district',
            $event->scope_type === Event::SCOPE_SECTION
                ? $event->section?->name ?? 'Sectional'
                : 'District-wide',
            $event->department?->name ?? 'No department',
        ];

        return implode(' · ', $scopeParts);
    }

    /**
     * @return array{scope_type: string, district_id: int|null, section_id: int|null, department_id: int|null}
     */
    private function formDefaults($user): array
    {
        $districtId = null;
        $sectionId = null;

        if ($user?->isAdmin()) {
            $districtId = $user->district_id;
        }

        if ($user?->isManager()) {
            $sectionId = $user->section_id;
            $districtId = $user->district_id
                ?? $user->section?->district_id
                ?? $user->section()->value('district_id');
        }

        return [
            'scope_type' => $this->scopeTypeOptions($user)[0]['value'] ?? Event::SCOPE_DISTRICT,
            'district_id' => $districtId,
            'section_id' => $sectionId,
            'department_id' => $user?->isSuperAdmin() ? null : $user?->department_id,
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
