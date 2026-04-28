<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\User;
use App\Support\DepartmentScopeAccess;
use App\Support\EventCapacity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, EventCapacity $eventCapacity): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $user->loadMissing([
            'role',
            'district',
            'section.district',
            'pastor.section.district',
        ]);

        $allOpenEvents = $this->openEvents($user, $eventCapacity);
        $registrationQuery = $this->registrationQuery($user);

        return Inertia::render('dashboard', [
            'dashboard' => [
                'account_notice' => $this->accountNotice($user),
                'actions' => $this->actions($user),
                'links' => $this->links($user),
                'metrics' => $this->metrics($user, count($allOpenEvents), $registrationQuery),
                'open_events' => array_slice($allOpenEvents, 0, 3),
                'recent_registrations' => $this->recentRegistrations($user, 3),
            ],
        ]);
    }

    /**
     * Build the quick actions available on the dashboard.
     *
     * @return array<int, array{label: string, description: string, href: string}>
     */
    private function actions(User $user): array
    {
        if ($user->hasAdminAccess()) {
            return [
                [
                    'label' => 'Manage events',
                    'description' => 'Schedules, capacities, and fee categories',
                    'href' => route('admin.events.index', absolute: false),
                ],
                [
                    'label' => 'Manage users',
                    'description' => 'Role assignments and scoped access',
                    'href' => route('admin.users.index', absolute: false),
                ],
                [
                    'label' => 'Pastor records',
                    'description' => 'Church directory and section assignments',
                    'href' => route('admin.pastors.index', absolute: false),
                ],
            ];
        }

        if ($user->isManager() || $user->isRegistrationStaff()) {
            return [
                [
                    'label' => 'New onsite registration',
                    'description' => 'Encode a grouped onsite transaction',
                    'href' => route('registrations.onsite.create', absolute: false),
                ],
                [
                    'label' => 'Onsite registrations',
                    'description' => 'Review encoded transactions and payment states',
                    'href' => route('registrations.onsite.index', absolute: false),
                ],
            ];
        }

        if ($user->hasApprovedOnlineRegistrationAccess()) {
            return [
                [
                    'label' => 'New online registration',
                    'description' => 'Submit a new church registration with receipt upload',
                    'href' => route('registrations.online.create', absolute: false),
                ],
                [
                    'label' => 'My submissions',
                    'description' => 'Review recent online registrations and statuses',
                    'href' => route('registrations.online.index', absolute: false),
                ],
            ];
        }

        return [];
    }

    /**
     * Build footer links for the lower dashboard cards.
     *
     * @return array{
     *     open_events: array{label: string, href: string},
     *     recent_activity: array{label: string, href: string}
     * }
     */
    private function links(User $user): array
    {
        if ($user->hasAdminAccess()) {
            return [
                'open_events' => [
                    'label' => 'View all events',
                    'href' => route('admin.events.index', absolute: false),
                ],
                'recent_activity' => [
                    'label' => 'Open event management',
                    'href' => route('admin.events.index', absolute: false),
                ],
            ];
        }

        if ($user->isManager() || $user->isRegistrationStaff()) {
            return [
                'open_events' => [
                    'label' => 'Open onsite registration',
                    'href' => route('registrations.onsite.create', absolute: false),
                ],
                'recent_activity' => [
                    'label' => 'View onsite registrations',
                    'href' => route('registrations.onsite.index', absolute: false),
                ],
            ];
        }

        if ($user->hasApprovedOnlineRegistrationAccess()) {
            return [
                'open_events' => [
                    'label' => 'Open online registration',
                    'href' => route('registrations.online.create', absolute: false),
                ],
                'recent_activity' => [
                    'label' => 'View online registrations',
                    'href' => route('registrations.online.index', absolute: false),
                ],
            ];
        }

        return [
            'open_events' => [
                'label' => 'Go to dashboard',
                'href' => route('dashboard', absolute: false),
            ],
            'recent_activity' => [
                'label' => 'Go to dashboard',
                'href' => route('dashboard', absolute: false),
            ],
        ];
    }

    /**
     * Build the account approval notice for pending or rejected registrant accounts.
     *
     * @return array{status: string, title: string, description: string}|null
     */
    private function accountNotice(User $user): ?array
    {
        if (! $user->isOnlineRegistrant() || $user->pastor_id === null || $user->isApprovalApproved()) {
            return null;
        }

        if ($user->isApprovalRejected()) {
            return [
                'status' => User::APPROVAL_REJECTED,
                'title' => 'Registrant access is awaiting follow-up',
                'description' => 'Your church representative account is not yet approved for online registration. Contact the district admin or your section manager for the next review step.',
            ];
        }

        return [
            'status' => User::APPROVAL_PENDING,
            'title' => 'Registrant access is pending approval',
            'description' => 'You can sign in and review your assigned church scope now, but online registration will stay locked until an admin or manager approves this account request.',
        ];
    }

    /**
     * Build the dashboard metrics.
     *
     * @return array<int, array{label: string, value: int, description: string}>
     */
    private function metrics(User $user, int $openEventsCount, Builder $registrationQuery): array
    {
        $registrationCount = (clone $registrationQuery)->count();
        $pendingVerificationCount = (clone $registrationQuery)
            ->where('registration_status', Registration::STATUS_PENDING_VERIFICATION)
            ->count();
        $activeUsersCount = $this->activeUsersCount($user);
        $activeChurchesCount = $this->activeChurchesCount($user);

        if ($user->isSuperAdmin()) {
            return [
                [
                    'label' => 'Open events',
                    'value' => $openEventsCount,
                    'description' => 'Events currently accepting registrations',
                ],
                [
                    'label' => 'Pending verification',
                    'value' => $pendingVerificationCount,
                    'description' => 'Registrations waiting for review',
                ],
                [
                    'label' => 'Active users',
                    'value' => $activeUsersCount,
                    'description' => 'Accounts with active workspace access',
                ],
                [
                    'label' => 'Active churches',
                    'value' => $activeChurchesCount,
                    'description' => 'Church records ready for registration use',
                ],
            ];
        }

        if ($user->isAdmin()) {
            return [
                [
                    'label' => 'Open events',
                    'value' => $openEventsCount,
                    'description' => 'Events currently accepting registrations',
                ],
                [
                    'label' => 'Pending verification',
                    'value' => $pendingVerificationCount,
                    'description' => 'Registrations waiting for review',
                ],
                [
                    'label' => 'Active users',
                    'value' => $activeUsersCount,
                    'description' => 'Accounts with active workspace access',
                ],
                [
                    'label' => 'Active churches',
                    'value' => $activeChurchesCount,
                    'description' => 'Church records ready for registration use',
                ],
            ];
        }

        if ($user->isManager()) {
            $pastorCount = $user->section_id === null
                ? 0
                : Pastor::query()
                    ->where('section_id', $user->section_id)
                    ->where('status', 'active')
                    ->count();

            return [
                [
                    'label' => 'Assigned churches',
                    'value' => $pastorCount,
                    'description' => 'Active churches in your section',
                ],
                [
                    'label' => 'Section registrations',
                    'value' => $registrationCount,
                    'description' => 'Registrations within your section scope',
                ],
                [
                    'label' => 'Pending verification',
                    'value' => $pendingVerificationCount,
                    'description' => 'Section submissions still awaiting review',
                ],
                [
                    'label' => 'Open events',
                    'value' => $openEventsCount,
                    'description' => 'Events your section can register into',
                ],
            ];
        }

        if ($user->isRegistrationStaff()) {
            return [
                [
                    'label' => 'Open events',
                    'value' => $openEventsCount,
                    'description' => 'Current events available for encoding',
                ],
                [
                    'label' => 'Encoded transactions',
                    'value' => $registrationCount,
                    'description' => 'Onsite registrations created by your account',
                ],
                [
                    'label' => 'Paid transactions',
                    'value' => (clone $registrationQuery)
                        ->where('payment_status', Registration::PAYMENT_STATUS_PAID)
                        ->count(),
                    'description' => 'Transactions marked paid in your history',
                ],
                [
                    'label' => 'Pending verification',
                    'value' => $pendingVerificationCount,
                    'description' => 'Transactions still awaiting verification',
                ],
            ];
        }

        return [
            [
                'label' => 'Open events',
                'value' => $openEventsCount,
                'description' => 'Events available to your church account',
            ],
            [
                'label' => 'Submitted registrations',
                'value' => $registrationCount,
                'description' => 'Online registrations under your church scope',
            ],
            [
                'label' => 'Pending verification',
                'value' => $pendingVerificationCount,
                'description' => 'Submissions still awaiting review',
            ],
            [
                'label' => 'Verified or completed',
                'value' => (clone $registrationQuery)
                    ->whereIn('registration_status', [
                        Registration::STATUS_VERIFIED,
                        Registration::STATUS_COMPLETED,
                    ])
                    ->count(),
                'description' => 'Approved registrations within your church scope',
            ],
        ];
    }

    /**
     * Build the open event cards shown on the dashboard.
     *
     * @return array<int, array{
     *     id: int,
     *     name: string,
     *     venue: string,
     *     date_from: string,
     *     date_to: string,
     *     remaining_slots: int,
     *     registration_close_at: string
     * }>
     */
    private function openEvents(User $user, EventCapacity $eventCapacity): array
    {
        $query = Event::query()
            ->where('status', Event::STATUS_OPEN)
            ->whereHas('feeCategories', function (Builder $query): void {
                $query->where('status', 'active');
            })
            ->withCapacityMetrics()
            ->with([
                'feeCategories' => fn ($query) => $query
                    ->where('status', 'active')
                    ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity'),
            ])
            ->orderBy('date_from');

        DepartmentScopeAccess::scopeAccessibleEvents($query, $user);

        return $query
            ->get()
            ->each(fn (Event $event): bool => $event->syncOperationalStatus())
            ->filter(function (Event $event) use ($eventCapacity): bool {
                if (! $event->canAcceptRegistrations()) {
                    return false;
                }

                return $eventCapacity->eventHasAvailableFeeCategories($event);
            })
            ->map(fn (Event $event): array => [
                'id' => $event->getKey(),
                'name' => $event->name,
                'venue' => $event->venue,
                'date_from' => $event->date_from->toDateString(),
                'date_to' => $event->date_to->toDateString(),
                'remaining_slots' => $eventCapacity->remainingSlotsForEvent($event),
                'registration_close_at' => $event->registration_close_at->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /**
     * Build the recent registration activity cards.
     *
     * @return array<int, array{
     *     id: int,
     *     event_name: string,
     *     church_name: string,
     *     registration_mode: string,
     *     registration_status: string,
     *     payment_status: string,
     *     submitted_at: string|null,
     *     total_quantity: int,
     *     total_amount: string
     * }>
     */
    private function recentRegistrations(User $user, int $limit = 5): array
    {
        return $this->registrationQuery($user)
            ->with([
                'event:id,name',
                'pastor:id,church_name',
            ])
            ->withSum('items as total_quantity', 'quantity')
            ->withSum('items as total_amount', 'subtotal_amount')
            ->orderByDesc('submitted_at')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Registration $registration): array => [
                'id' => $registration->getKey(),
                'event_name' => $registration->event?->name ?? 'Unknown event',
                'church_name' => $registration->pastor?->church_name ?? 'Unknown church',
                'registration_mode' => $registration->registration_mode,
                'registration_status' => $registration->registration_status,
                'payment_status' => $registration->payment_status,
                'submitted_at' => $registration->submitted_at?->toIso8601String(),
                'total_quantity' => (int) ($registration->getAttribute('total_quantity') ?? 0),
                'total_amount' => number_format((float) ($registration->getAttribute('total_amount') ?? 0), 2, '.', ''),
            ])
            ->values()
            ->all();
    }

    private function registrationQuery(User $user): Builder
    {
        $query = Registration::query();

        if ($user->isSuperAdmin()) {
            return $query;
        }

        if ($user->isAdmin()) {
            if ($user->district_id === null) {
                return $query->whereRaw('1 = 0');
            }

            return $query
                ->whereHas('event', function (Builder $eventQuery) use ($user): void {
                    DepartmentScopeAccess::scopeAccessibleEvents($eventQuery, $user);
                })
                ->whereHas('pastor.section', function (Builder $sectionQuery) use ($user): void {
                    $sectionQuery->where('district_id', $user->district_id);
                });
        }

        if ($user->isManager()) {
            if ($user->section_id === null) {
                return $query->whereRaw('1 = 0');
            }

            return $query
                ->whereHas('event', function (Builder $eventQuery) use ($user): void {
                    DepartmentScopeAccess::scopeAccessibleEvents($eventQuery, $user);
                })
                ->whereHas('pastor', function (Builder $pastorQuery) use ($user): void {
                    $pastorQuery->where('section_id', $user->section_id);
                });
        }

        if ($user->isRegistrationStaff()) {
            return $query->where('encoded_by_user_id', $user->getKey());
        }

        if ($user->isOnlineRegistrant() && $user->pastor_id !== null) {
            return $query->where('pastor_id', $user->pastor_id);
        }

        return $query->whereRaw('1 = 0');
    }

    private function activeUsersCount(User $user): int
    {
        $query = User::query()->where('status', User::STATUS_ACTIVE);

        if ($user->isSuperAdmin()) {
            return $query->count();
        }

        if (! $user->isAdmin() || $user->district_id === null) {
            return 0;
        }

        return $query
            ->where(function (Builder $scopeQuery) use ($user): void {
                $scopeQuery
                    ->where('district_id', $user->district_id)
                    ->orWhereHas('section', function (Builder $sectionQuery) use ($user): void {
                        $sectionQuery->where('district_id', $user->district_id);
                    })
                    ->orWhereHas('pastor.section', function (Builder $sectionQuery) use ($user): void {
                        $sectionQuery->where('district_id', $user->district_id);
                    });
            })
            ->count();
    }

    private function activeChurchesCount(User $user): int
    {
        $query = Pastor::query()->where('status', 'active');

        if ($user->isSuperAdmin()) {
            return $query->count();
        }

        if (! $user->isAdmin() || $user->district_id === null) {
            return 0;
        }

        return $query
            ->whereHas('section', function (Builder $sectionQuery) use ($user): void {
                $sectionQuery->where('district_id', $user->district_id);
            })
            ->count();
    }
}
