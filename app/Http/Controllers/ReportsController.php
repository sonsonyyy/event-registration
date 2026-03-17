<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexReportRequest;
use App\Models\Event;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
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
        $events = $this->eventOptions();
        $sections = $this->sectionOptions($user);
        $selectedEvent = $this->selectedEvent($events, $filters['event_id']);
        $selectedSection = $this->selectedSection($user, $sections, $filters['section_id']);
        $churchesWithoutRegistration = $selectedEvent !== null
            ? $this->churchesWithoutRegistrationQuery(
                $user,
                $selectedEvent,
                $selectedSection,
                $filters['search'],
            )
                ->orderBy('church_name')
                ->paginate($filters['per_page'])
                ->withQueryString()
            : null;

        return Inertia::render('reports/index', [
            'scopeSummary' => $this->scopeSummary($user),
            'canFilterBySection' => ! $user->isManager(),
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

    public function exportChurchesWithoutRegistration(IndexReportRequest $request): StreamedResponse
    {
        Gate::authorize('viewReports');

        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $filters = $request->filters();
        $events = $this->eventOptions();
        $sections = $this->sectionOptions($user);
        $selectedEvent = $this->selectedEvent($events, $filters['event_id']);

        abort_if($selectedEvent === null, 404);

        $selectedSection = $this->selectedSection($user, $sections, $filters['section_id']);
        $churches = $this->churchesWithoutRegistrationQuery(
            $user,
            $selectedEvent,
            $selectedSection,
            $filters['search'],
        )
            ->orderBy('church_name')
            ->get();

        $filename = $this->churchesWithoutRegistrationFilename($selectedEvent, $selectedSection);

        return response()->streamDownload(
            function () use ($selectedEvent, $selectedSection, $filters, $churches): void {
                echo $this->churchesWithoutRegistrationSpreadsheet(
                    $selectedEvent,
                    $selectedSection,
                    $filters['search'],
                    $churches,
                );
            },
            $filename,
            [
                'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
                'Cache-Control' => 'max-age=0',
            ],
        );
    }

    /**
     * Fetch the events available for reporting.
     *
     * @return Collection<int, Event>
     */
    private function eventOptions(): Collection
    {
        return Event::query()
            ->withTrashed()
            ->with([
                'feeCategories' => fn ($query) => $query
                    ->withTrashed()
                    ->orderBy('id'),
            ])
            ->orderByRaw('deleted_at IS NOT NULL')
            ->orderByDesc('date_from')
            ->orderByDesc('id')
            ->get();
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

    private function selectedSection(User $user, Collection $sections, ?int $sectionId): ?Section
    {
        if ($sections->isEmpty()) {
            return null;
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
            ])
            ->get();

        $items = $registrations->flatMap->items;
        $feeCategories = $event->feeCategories
            ->sortBy('id')
            ->values();

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
        ];
    }

    /**
     * Build the no-registration report for the selected event.
     *
     * @return array<string, mixed>
     */
    private function churchesWithoutRegistrationQuery(
        User $user,
        Event $event,
        ?Section $section,
        string $search,
    ): Builder {
        $pastorsQuery = Pastor::query()
            ->with('section.district')
            ->where('status', 'active');

        $sectionId = $user->isManager()
            ? $user->section_id
            : $section?->getKey();

        if ($sectionId !== null) {
            $pastorsQuery->where('section_id', $sectionId);
        }

        $pastorsQuery
            ->whereDoesntHave('registrations', function (Builder $query) use ($event): void {
                $query
                    ->where('event_id', $event->getKey())
                    ->whereIn('registration_status', Registration::capacityReservedStatuses());
            });

        if ($search !== '') {
            $pastorsQuery->where(function (Builder $query) use ($search): void {
                $query
                    ->where('pastor_name', 'like', "%{$search}%")
                    ->orWhere('church_name', 'like', "%{$search}%")
                    ->orWhereHas('section', function (Builder $sectionQuery) use ($search): void {
                        $sectionQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return $pastorsQuery;
    }

    private function emptyEventTotalRegistrationReport(): array
    {
        return [
            'total_registered_quantity' => 0,
            'registration_count' => 0,
            'verified_online_quantity' => 0,
            'pending_online_quantity' => 0,
            'fee_categories' => [],
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

    private function churchesWithoutRegistrationFilename(Event $event, ?Section $section): string
    {
        $parts = [
            Str::slug($event->name),
            'churches-without-registration',
        ];

        if ($section !== null) {
            $parts[] = Str::slug($section->name);
        }

        return implode('-', $parts).'.xls';
    }

    /**
     * @param  Collection<int, Pastor>  $churches
     */
    private function churchesWithoutRegistrationSpreadsheet(
        Event $event,
        ?Section $section,
        string $search,
        Collection $churches,
    ): string {
        $rows = $churches
            ->map(function (Pastor $pastor): string {
                return sprintf(
                    '<tr><td>%s</td><td>%s</td><td>%s</td></tr>',
                    e($pastor->pastor_name),
                    e($pastor->church_name),
                    e($pastor->section?->name ?? 'Unassigned'),
                );
            })
            ->implode('');

        $eventName = e($event->name);
        $scope = e($section?->name ?? 'All sections');
        $searchSummary = $search !== '' ? e($search) : 'All visible churches';
        $rows = $rows !== ''
            ? $rows
            : '<tr><td colspan="3">No churches found for the current filter.</td></tr>';

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Churches with No Registration</title>
</head>
<body>
    <table border="1">
        <tr><td colspan="3"><strong>Event</strong></td></tr>
        <tr><td colspan="3">{$eventName}</td></tr>
        <tr><td colspan="3"><strong>Section Scope</strong></td></tr>
        <tr><td colspan="3">{$scope}</td></tr>
        <tr><td colspan="3"><strong>Search</strong></td></tr>
        <tr><td colspan="3">{$searchSummary}</td></tr>
    </table>
    <br>
    <table border="1">
        <thead>
            <tr>
                <th>Pastor Name</th>
                <th>Church Name</th>
                <th>Section</th>
            </tr>
        </thead>
        <tbody>
            {$rows}
        </tbody>
    </table>
</body>
</html>
HTML;
    }

    private function scopeSummary(User $user): string
    {
        if ($user->isAdmin()) {
            return 'All sections and churches';
        }

        $section = $user->section()
            ->with('district')
            ->first();

        if ($section === null) {
            return 'Assigned report scope';
        }

        return $section->district->name.' • '.$section->name;
    }

    private function quantityForStatus(Collection $registrations, string $mode, string $status): int
    {
        return (int) $registrations
            ->where('registration_mode', $mode)
            ->where('registration_status', $status)
            ->sum(fn (Registration $registration): int => (int) $registration->items->sum('quantity'));
    }

    private function scopedRegistrationsQuery(User $user, Event $event, ?Section $section): Builder
    {
        $query = Registration::query()
            ->where('event_id', $event->getKey())
            ->whereIn('registration_status', Registration::capacityReservedStatuses());

        $sectionId = $user->isManager()
            ? $user->section_id
            : $section?->getKey();

        if ($sectionId !== null) {
            $query->whereHas('pastor', function (Builder $pastorQuery) use ($sectionId): void {
                $pastorQuery->where('section_id', $sectionId);
            });
        }

        return $query;
    }
}
