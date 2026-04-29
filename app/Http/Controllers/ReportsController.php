<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexReportRequest;
use App\Models\Event;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Section;
use App\Models\User;
use App\Support\DepartmentScopeAccess;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Spatie\SimpleExcel\SimpleExcelWriter;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(IndexReportRequest $request): Response
    {
        Gate::authorize('viewReports');

        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $filters = $request->filters();
        $events = $this->eventOptions($user);
        $sections = $this->sectionOptions($user);
        $selectedEvent = $this->selectedEvent($events, $filters['event_id']);
        $selectedSection = $this->selectedSection($user, $selectedEvent, $sections, $filters['section_id']);
        $churchesWithRegistration = $selectedEvent !== null
            ? $this->churchesWithRegistrationQuery(
                $user,
                $selectedEvent,
                $selectedSection,
                $filters['search'],
            )
                ->paginate($filters['per_page'])
                ->withQueryString()
            : null;
        $churchesWithoutRegistration = $selectedEvent !== null
            ? $this->churchesWithoutRegistrationQuery(
                $user,
                $selectedEvent,
                $selectedSection,
                $filters['search'],
            )
                ->paginate($filters['per_page'])
                ->withQueryString()
            : null;

        return Inertia::render('reports/index', [
            'scopeSummary' => $this->scopeSummary($user),
            'canFilterBySection' => $this->canFilterBySection($user, $selectedEvent),
            'events' => $events
                ->map(fn (Event $event): array => [
                    'id' => $event->getKey(),
                    'name' => $event->name,
                    'venue' => $event->venue,
                    'date_from' => $event->date_from?->toDateString(),
                    'date_to' => $event->date_to?->toDateString(),
                    'status' => $event->status,
                ])
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
            'filters' => [
                'event_id' => $selectedEvent?->getKey(),
                'section_id' => $selectedSection?->getKey(),
                'tab' => $filters['tab'],
                'search' => $filters['search'],
                'per_page' => $filters['per_page'],
            ],
            'perPageOptions' => [10, 25, 50],
            'selectedEvent' => $selectedEvent ? [
                'id' => $selectedEvent->getKey(),
                'name' => $selectedEvent->name,
                'venue' => $selectedEvent->venue,
                'description' => $selectedEvent->description,
                'date_from' => $selectedEvent->date_from?->toDateString(),
                'date_to' => $selectedEvent->date_to?->toDateString(),
                'status' => $selectedEvent->status,
            ] : null,
            'selectedSection' => $selectedSection ? [
                'id' => $selectedSection->getKey(),
                'name' => $selectedSection->name,
                'district_name' => $selectedSection->district?->name,
            ] : null,
            'eventTotalRegistration' => $selectedEvent
                ? $this->eventTotalRegistrationReport($user, $selectedEvent, $selectedSection)
                : $this->emptyEventTotalRegistrationReport(),
            'churchesWithRegistration' => $selectedEvent !== null && $churchesWithRegistration instanceof LengthAwarePaginator
                ? [
                    'data' => $churchesWithRegistration->getCollection()
                        ->map(fn (Pastor $pastor): array => $this->churchWithRegistrationData($pastor))
                        ->values()
                        ->all(),
                    'meta' => $this->paginationMeta($churchesWithRegistration),
                ]
                : $this->emptyChurchesWithRegistrationReport($filters['per_page']),
            'churchesWithRegistrationExportUrl' => $selectedEvent !== null
                ? route('reports.churches-with-registration.export', $this->reportQuery(
                    $selectedEvent,
                    $selectedSection,
                    $filters['search'],
                ))
                : null,
            'churchesWithoutRegistration' => $selectedEvent !== null && $churchesWithoutRegistration instanceof LengthAwarePaginator
                ? [
                    'data' => $churchesWithoutRegistration->getCollection()
                        ->map(fn (Pastor $pastor): array => $this->churchWithoutRegistrationData($pastor))
                        ->values()
                        ->all(),
                    'meta' => $this->paginationMeta($churchesWithoutRegistration),
                ]
                : $this->emptyChurchesWithoutRegistrationReport($filters['per_page']),
            'churchesWithoutRegistrationExportUrl' => $selectedEvent !== null
                ? route('reports.churches-without-registration.export', $this->reportQuery(
                    $selectedEvent,
                    $selectedSection,
                    $filters['search'],
                ))
                : null,
        ]);
    }

    public function exportChurchesWithRegistration(IndexReportRequest $request): StreamedResponse
    {
        Gate::authorize('viewReports');

        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $filters = $request->filters();
        $events = $this->eventOptions($user);
        $sections = $this->sectionOptions($user);
        $selectedEvent = $this->selectedEvent($events, $filters['event_id']);

        abort_if($selectedEvent === null, 404);

        $selectedSection = $this->selectedSection($user, $selectedEvent, $sections, $filters['section_id']);
        $churches = $this->churchesWithRegistrationQuery(
            $user,
            $selectedEvent,
            $selectedSection,
            $filters['search'],
        )->get();

        return $this->downloadSpreadsheet(
            $this->churchesWithRegistrationFilename(),
            $this->churchesWithRegistrationExportRows($churches),
        );
    }

    public function exportChurchesWithoutRegistration(IndexReportRequest $request): StreamedResponse
    {
        Gate::authorize('viewReports');

        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $filters = $request->filters();
        $events = $this->eventOptions($user);
        $sections = $this->sectionOptions($user);
        $selectedEvent = $this->selectedEvent($events, $filters['event_id']);

        abort_if($selectedEvent === null, 404);

        $selectedSection = $this->selectedSection($user, $selectedEvent, $sections, $filters['section_id']);
        $churches = $this->churchesWithoutRegistrationQuery(
            $user,
            $selectedEvent,
            $selectedSection,
            $filters['search'],
        )->get();

        return $this->downloadSpreadsheet(
            $this->churchesWithoutRegistrationFilename(),
            $this->churchesWithoutRegistrationExportRows($churches),
        );
    }

    /**
     * Fetch the events available for reporting.
     *
     * @return Collection<int, Event>
     */
    private function eventOptions(User $user): Collection
    {
        $query = Event::query()
            ->withTrashed()
            ->with([
                'feeCategories' => fn ($query) => $query
                    ->withTrashed()
                    ->orderBy('id'),
                'section:id,name,district_id',
                'department:id,name',
            ])
            ->orderByRaw('deleted_at IS NOT NULL')
            ->orderByDesc('date_from')
            ->orderByDesc('id');

        DepartmentScopeAccess::scopeAccessibleEvents($query, $user);

        return $query->get();
    }

    /**
     * Fetch the sections available for the authenticated user's report scope.
     *
     * @return Collection<int, Section>
     */
    private function sectionOptions(User $user): Collection
    {
        $sections = Section::query()
            ->with('district')
            ->where('status', 'active')
            ->orderBy('name');

        if ($user->isManager()) {
            $sections->whereKey($user->section_id);
        } elseif ($user->isAdmin()) {
            if ($user->district_id === null) {
                $sections->whereRaw('1 = 0');
            } else {
                $sections->where('district_id', $user->district_id);
            }
        }

        return $sections->get();
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

    private function selectedSection(User $user, ?Event $event, Collection $sections, ?int $sectionId): ?Section
    {
        if ($sections->isEmpty()) {
            return null;
        }

        if ($event?->isSectionScoped()) {
            return $event->section;
        }

        if ($user->isManager()) {
            /** @var Section|null $managedSection */
            $managedSection = $sections->first();

            return $managedSection;
        }

        if ($sectionId === null) {
            return null;
        }

        /** @var Section|null $selectedSection */
        $selectedSection = $sections->firstWhere('id', $sectionId);

        return $selectedSection;
    }

    /**
     * Build the event total registration report for the selected scope.
     *
     * @return array<string, mixed>
     */
    private function eventTotalRegistrationReport(User $user, Event $event, ?Section $section): array
    {
        $registrations = $this->scopedRegistrationsQuery($user, $event, $section)
            ->with([
                'items.feeCategory',
                'pastor.section.district',
            ])
            ->get();
        $visiblePastors = $this->scopedPastorsQuery($user, $event, $section)->get();

        $items = $registrations->flatMap->items;
        $registrationsByPastor = $registrations->groupBy('pastor_id');
        $feeCategories = $event->feeCategories
            ->sortBy('id')
            ->values();
        $totalRegisteredAmount = $this->formatAmount($items->sum(
            fn (RegistrationItem $item): float => (float) $item->subtotal_amount
        ));

        $verifiedOnlineQuantity = $this->quantityForStatus(
            $registrations,
            Registration::MODE_ONLINE,
            Registration::STATUS_VERIFIED,
        );

        $pendingOnlineQuantity = $this->quantityForStatus(
            $registrations,
            Registration::MODE_ONLINE,
            Registration::STATUS_PENDING_VERIFICATION,
        );

        return [
            'total_registered_quantity' => (int) $items->sum('quantity'),
            'total_registered_amount' => $totalRegisteredAmount,
            'registration_count' => $registrations->count(),
            'verified_online_quantity' => $verifiedOnlineQuantity,
            'pending_online_quantity' => $pendingOnlineQuantity,
            'fee_categories' => $feeCategories
                ->map(function ($feeCategory) use ($items): array {
                    $categoryItems = $items->where('fee_category_id', $feeCategory->getKey());

                    return [
                        'id' => $feeCategory->getKey(),
                        'category_name' => $feeCategory->category_name,
                        'amount' => number_format((float) $feeCategory->amount, 2, '.', ''),
                        'slot_limit' => $feeCategory->slot_limit,
                        'registered_quantity' => (int) $categoryItems->sum('quantity'),
                        'registered_amount' => number_format((float) $categoryItems->sum(
                            fn (RegistrationItem $item): float => (float) $item->subtotal_amount
                        ), 2, '.', ''),
                    ];
                })
                ->values()
                ->all(),
            'fee_category_totals' => [
                'registered_quantity' => (int) $items->sum('quantity'),
                'registered_amount' => $totalRegisteredAmount,
            ],
            'section_summaries' => $this->sectionSummaries($visiblePastors, $registrationsByPastor),
            'section_summary_totals' => [
                'active_churches' => $visiblePastors->count(),
                'registered_churches' => $visiblePastors
                    ->filter(fn (Pastor $pastor): bool => ($registrationsByPastor->get($pastor->getKey())?->isNotEmpty() ?? false))
                    ->count(),
                'registration_count' => $registrations->count(),
                'total_registered_quantity' => (int) $items->sum('quantity'),
                'total_registered_amount' => $totalRegisteredAmount,
            ],
            'church_summaries' => $this->churchSummaries($visiblePastors, $registrationsByPastor),
            'church_summary_totals' => [
                'church_count' => $visiblePastors->count(),
                'registered_churches' => $visiblePastors
                    ->filter(fn (Pastor $pastor): bool => ($registrationsByPastor->get($pastor->getKey())?->isNotEmpty() ?? false))
                    ->count(),
                'registration_count' => $registrations->count(),
                'total_registered_quantity' => (int) $items->sum('quantity'),
                'total_registered_amount' => $totalRegisteredAmount,
            ],
        ];
    }

    private function churchesWithRegistrationQuery(
        User $user,
        Event $event,
        ?Section $section,
        string $search,
    ): Builder {
        $pastorsQuery = $this->scopedPastorsQuery($user, $event, $section);
        $pastorsQuery
            ->with([
                'registrations' => function ($query) use ($event): void {
                    $query
                        ->where('event_id', $event->getKey())
                        ->whereIn('registration_status', Registration::capacityReservedStatuses())
                        ->with('items');
                },
            ])
            ->whereHas('registrations', function (Builder $query) use ($event): void {
                $query
                    ->where('event_id', $event->getKey())
                    ->whereIn('registration_status', Registration::capacityReservedStatuses());
            });

        $this->applyChurchSearch($pastorsQuery, $search);

        return $pastorsQuery;
    }

    private function churchesWithoutRegistrationQuery(
        User $user,
        Event $event,
        ?Section $section,
        string $search,
    ): Builder {
        $pastorsQuery = $this->scopedPastorsQuery($user, $event, $section);
        $pastorsQuery
            ->whereDoesntHave('registrations', function (Builder $query) use ($event): void {
                $query
                    ->where('event_id', $event->getKey())
                    ->whereIn('registration_status', Registration::capacityReservedStatuses());
            });

        $this->applyChurchSearch($pastorsQuery, $search);

        return $pastorsQuery;
    }

    private function applyChurchSearch(Builder $pastorsQuery, string $search): void
    {
        if ($search === '') {
            return;
        }

        $pastorsQuery->where(function (Builder $query) use ($search): void {
            $query
                ->where('pastor_name', 'like', "%{$search}%")
                ->orWhere('church_name', 'like', "%{$search}%")
                ->orWhereHas('section', function (Builder $sectionQuery) use ($search): void {
                    $sectionQuery->where('name', 'like', "%{$search}%");
                });
        });
    }

    private function emptyEventTotalRegistrationReport(): array
    {
        return [
            'total_registered_quantity' => 0,
            'total_registered_amount' => '0.00',
            'registration_count' => 0,
            'verified_online_quantity' => 0,
            'pending_online_quantity' => 0,
            'fee_categories' => [],
            'fee_category_totals' => [
                'registered_quantity' => 0,
                'registered_amount' => '0.00',
            ],
            'section_summaries' => [],
            'section_summary_totals' => [
                'active_churches' => 0,
                'registered_churches' => 0,
                'registration_count' => 0,
                'total_registered_quantity' => 0,
                'total_registered_amount' => '0.00',
            ],
            'church_summaries' => [],
            'church_summary_totals' => [
                'church_count' => 0,
                'registered_churches' => 0,
                'registration_count' => 0,
                'total_registered_quantity' => 0,
                'total_registered_amount' => '0.00',
            ],
        ];
    }

    private function emptyChurchesWithRegistrationReport(int $perPage): array
    {
        return [
            'data' => [],
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perPage,
                'from' => null,
                'to' => null,
                'total' => 0,
            ],
        ];
    }

    private function emptyChurchesWithoutRegistrationReport(int $perPage): array
    {
        return [
            'data' => [],
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perPage,
                'from' => null,
                'to' => null,
                'total' => 0,
            ],
        ];
    }

    private function churchWithRegistrationData(Pastor $pastor): array
    {
        /** @var Collection<int, Registration> $registrations */
        $registrations = $pastor->registrations;
        $items = $registrations->flatMap->items;

        return [
            'id' => $pastor->getKey(),
            'church_name' => $pastor->church_name,
            'pastor_name' => $pastor->pastor_name,
            'section_name' => $pastor->section?->name,
            'district_name' => $pastor->section?->district?->name,
            'registration_count' => $registrations->count(),
            'total_registered_quantity' => (int) $items->sum('quantity'),
            'total_registered_amount' => $this->formatAmount($items->sum(
                fn (RegistrationItem $item): float => (float) $item->subtotal_amount
            )),
        ];
    }

    private function churchWithoutRegistrationData(Pastor $pastor): array
    {
        return [
            'id' => $pastor->getKey(),
            'church_name' => $pastor->church_name,
            'pastor_name' => $pastor->pastor_name,
            'section_name' => $pastor->section?->name,
            'district_name' => $pastor->section?->district?->name,
        ];
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
     * @return array{event_id: int, section_id?: int, search?: string}
     */
    private function reportQuery(Event $event, ?Section $section, string $search): array
    {
        $query = [
            'event_id' => $event->getKey(),
        ];

        if ($section !== null) {
            $query['section_id'] = $section->getKey();
        }

        if ($search !== '') {
            $query['search'] = $search;
        }

        return $query;
    }

    private function churchesWithRegistrationFilename(): string
    {
        return 'registration-summary-by-church-'.now()->toDateString().'.xlsx';
    }

    private function churchesWithoutRegistrationFilename(): string
    {
        return 'no-registration-report-'.now()->toDateString().'.xlsx';
    }

    /**
     * @param  Collection<int, Pastor>  $churches
     */
    private function churchesWithRegistrationExportRows(Collection $churches): array
    {
        $rows = $churches
            ->map(fn (Pastor $pastor): array => $this->churchWithRegistrationData($pastor))
            ->map(fn (array $church): array => [
                'Church name' => $church['church_name'],
                'Pastor name' => $church['pastor_name'],
                'Section' => $church['section_name'] ?? 'Unassigned',
                'Registered quantity' => $church['total_registered_quantity'],
                'Registered value' => $church['total_registered_amount'],
            ])
            ->values();

        $rows->push([
            'Church name' => 'Totals',
            'Pastor name' => '',
            'Section' => '',
            'Registered quantity' => (int) $rows->sum(
                fn (array $row): int => (int) $row['Registered quantity']
            ),
            'Registered value' => $this->formatAmount($rows->sum(
                fn (array $row): float => (float) $row['Registered value']
            )),
        ]);

        return $rows->all();
    }

    /**
     * @param  Collection<int, Pastor>  $churches
     */
    private function churchesWithoutRegistrationExportRows(Collection $churches): array
    {
        $rows = $churches
            ->map(fn (Pastor $pastor): array => $this->churchWithoutRegistrationData($pastor))
            ->map(fn (array $church): array => [
                'Pastor name' => $church['pastor_name'],
                'Church name' => $church['church_name'],
                'Section' => $church['section_name'] ?? 'Unassigned',
            ])
            ->values();

        $rows->push([
            'Pastor name' => 'Totals',
            'Church name' => $this->churchCountLabel($rows->count()),
            'Section' => '',
        ]);

        return $rows->all();
    }

    /**
     * @param  array<int, array<string, int|string>>  $rows
     */
    private function downloadSpreadsheet(string $filename, array $rows): StreamedResponse
    {
        $temporaryPath = $this->temporarySpreadsheetPath();

        $writer = SimpleExcelWriter::create($temporaryPath);
        $writer->addRows($rows);
        $writer->close();

        return response()->streamDownload(
            function () use ($temporaryPath): void {
                $stream = fopen($temporaryPath, 'rb');

                if ($stream === false) {
                    throw new RuntimeException('Unable to open the generated spreadsheet for download.');
                }

                try {
                    fpassthru($stream);
                } finally {
                    fclose($stream);
                    @unlink($temporaryPath);
                }
            },
            $filename,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Cache-Control' => 'max-age=0',
            ],
        );
    }

    private function temporarySpreadsheetPath(): string
    {
        $temporaryPath = tempnam(sys_get_temp_dir(), 'report-export-');

        if ($temporaryPath === false) {
            throw new RuntimeException('Unable to create a temporary spreadsheet path.');
        }

        @unlink($temporaryPath);

        return $temporaryPath.'.xlsx';
    }

    private function churchCountLabel(int $count): string
    {
        return $count.' '.($count === 1 ? 'church' : 'churches');
    }

    private function scopeSummary(User $user): string
    {
        if ($user->isSuperAdmin()) {
            return 'All events, sections, and departments';
        }

        if ($user->isAdmin()) {
            return 'District events • '.$this->departmentLabel($user);
        }

        $section = $user->section()
            ->with('district')
            ->first();

        if ($section === null) {
            return 'Assigned report scope';
        }

        return $section->district->name
            .' • '
            .$section->name
            .' • '
            .$this->departmentLabel($user);
    }

    private function quantityForStatus(Collection $registrations, string $mode, string $status): int
    {
        return (int) $registrations
            ->where('registration_mode', $mode)
            ->where('registration_status', $status)
            ->sum(fn (Registration $registration): int => (int) $registration->items->sum('quantity'));
    }

    /**
     * @param  Collection<int, Pastor>  $visiblePastors
     * @param  Collection<int|string, Collection<int, Registration>>  $registrationsByPastor
     * @return array<int, array{
     *     id: int|null,
     *     name: string,
     *     district_name: string|null,
     *     active_churches: int,
     *     registered_churches: int,
     *     registration_count: int,
     *     total_registered_quantity: int,
     *     total_registered_amount: string
     * }>
     */
    private function sectionSummaries(Collection $visiblePastors, Collection $registrationsByPastor): array
    {
        return $visiblePastors
            ->groupBy('section_id')
            ->map(function (Collection $pastorsInSection) use ($registrationsByPastor): array {
                /** @var Pastor $firstPastor */
                $firstPastor = $pastorsInSection->first();
                $sectionRegistrations = $pastorsInSection->flatMap(
                    fn (Pastor $pastor): Collection => $registrationsByPastor->get($pastor->getKey(), collect())
                );
                $sectionItems = $sectionRegistrations->flatMap->items;

                return [
                    'id' => $firstPastor->section?->getKey() ?? $firstPastor->section_id,
                    'name' => $firstPastor->section?->name ?? 'Unassigned',
                    'district_name' => $firstPastor->section?->district?->name,
                    'active_churches' => $pastorsInSection->count(),
                    'registered_churches' => $pastorsInSection
                        ->filter(fn (Pastor $pastor): bool => ($registrationsByPastor->get($pastor->getKey())?->isNotEmpty() ?? false))
                        ->count(),
                    'registration_count' => $sectionRegistrations->count(),
                    'total_registered_quantity' => (int) $sectionItems->sum('quantity'),
                    'total_registered_amount' => $this->formatAmount($sectionItems->sum(
                        fn (RegistrationItem $item): float => (float) $item->subtotal_amount
                    )),
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Pastor>  $visiblePastors
     * @param  Collection<int|string, Collection<int, Registration>>  $registrationsByPastor
     * @return array<int, array{
     *     id: int,
     *     church_name: string,
     *     pastor_name: string,
     *     section_name: string|null,
     *     district_name: string|null,
     *     registration_count: int,
     *     total_registered_quantity: int,
     *     total_registered_amount: string
     * }>
     */
    private function churchSummaries(Collection $visiblePastors, Collection $registrationsByPastor): array
    {
        return $visiblePastors
            ->values()
            ->map(function (Pastor $pastor) use ($registrationsByPastor): array {
                $churchRegistrations = $registrationsByPastor->get($pastor->getKey(), collect());
                $churchItems = $churchRegistrations->flatMap->items;

                return [
                    'id' => $pastor->getKey(),
                    'church_name' => $pastor->church_name,
                    'pastor_name' => $pastor->pastor_name,
                    'section_name' => $pastor->section?->name,
                    'district_name' => $pastor->section?->district?->name,
                    'registration_count' => $churchRegistrations->count(),
                    'total_registered_quantity' => (int) $churchItems->sum('quantity'),
                    'total_registered_amount' => $this->formatAmount($churchItems->sum(
                        fn (RegistrationItem $item): float => (float) $item->subtotal_amount
                    )),
                ];
            })
            ->all();
    }

    private function scopedRegistrationsQuery(User $user, Event $event, ?Section $section): Builder
    {
        $query = Registration::query()
            ->where('event_id', $event->getKey())
            ->whereIn('registration_status', Registration::capacityReservedStatuses());

        $sectionId = $event->isSectionScoped()
            ? $event->section_id
            : ($user->isManager()
                ? $user->section_id
                : $section?->getKey());

        if ($sectionId !== null) {
            $query->whereHas('pastor', function (Builder $pastorQuery) use ($sectionId): void {
                $pastorQuery->where('section_id', $sectionId);
            });
        }

        return $query;
    }

    private function scopedPastorsQuery(User $user, Event $event, ?Section $section): Builder
    {
        $query = Pastor::query()
            ->with('section.district')
            ->where('status', 'active')
            ->orderBy('church_name')
            ->orderBy('pastor_name')
            ->orderBy('id');

        $sectionId = $event->isSectionScoped()
            ? $event->section_id
            : ($user->isManager()
                ? $user->section_id
                : $section?->getKey());

        if ($sectionId !== null) {
            return $query->where('section_id', $sectionId);
        }

        if ($event->district_id !== null) {
            $query->whereHas('section', function (Builder $sectionQuery) use ($event): void {
                $sectionQuery->where('district_id', $event->district_id);
            });
        } else {
            $query->whereRaw('1 = 0');
        }

        return $query;
    }

    private function canFilterBySection(User $user, ?Event $selectedEvent): bool
    {
        if ($user->isManager()) {
            return false;
        }

        return ! $selectedEvent?->isSectionScoped();
    }

    private function departmentLabel(User $user): string
    {
        return $user->department?->name
            ?? $user->department()->value('name')
            ?? 'No department';
    }

    private function formatAmount(float|int $amount): string
    {
        return number_format((float) $amount, 2, '.', '');
    }
}
