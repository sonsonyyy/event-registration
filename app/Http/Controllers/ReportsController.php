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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

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
            ],
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
            'noRegistrationReport' => $selectedEvent
                ? $this->noRegistrationReport($user, $selectedEvent)
                : $this->emptyNoRegistrationReport(),
        ]);
    }

    /**
     * Fetch the events available for reporting.
     *
     * @return Collection<int, Event>
     */
    private function eventOptions(): Collection
    {
        return Event::query()
            ->with('feeCategories')
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
    private function noRegistrationReport(User $user, Event $event): array
    {
        $sectionsQuery = Section::query()
            ->with('district')
            ->where('status', 'active');

        $pastorsQuery = Pastor::query()
            ->with('section.district')
            ->where('status', 'active');

        if ($user->isManager()) {
            $sectionsQuery->whereKey($user->section_id);
            $pastorsQuery->where('section_id', $user->section_id);
        }

        $sections = $sectionsQuery
            ->whereDoesntHave('pastors.registrations', function (Builder $query) use ($event): void {
                $query
                    ->where('event_id', $event->getKey())
                    ->whereIn('registration_status', Registration::capacityReservedStatuses());
            })
            ->orderBy('name')
            ->get();

        $pastors = $pastorsQuery
            ->whereDoesntHave('registrations', function (Builder $query) use ($event): void {
                $query
                    ->where('event_id', $event->getKey())
                    ->whereIn('registration_status', Registration::capacityReservedStatuses());
            })
            ->orderBy('church_name')
            ->get();

        return [
            'sections' => $sections
                ->map(fn (Section $section): array => [
                    'id' => $section->getKey(),
                    'name' => $section->name,
                    'district_name' => $section->district?->name,
                ])
                ->values()
                ->all(),
            'pastors' => $pastors
                ->map(fn (Pastor $pastor): array => [
                    'id' => $pastor->getKey(),
                    'church_name' => $pastor->church_name,
                    'pastor_name' => $pastor->pastor_name,
                    'section_name' => $pastor->section?->name,
                    'district_name' => $pastor->section?->district?->name,
                ])
                ->values()
                ->all(),
        ];
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

    private function emptyNoRegistrationReport(): array
    {
        return [
            'sections' => [],
            'pastors' => [],
        ];
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
