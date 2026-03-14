<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user instanceof User, 403);

        $user->loadMissing([
            'role',
            'district',
            'section.district',
            'pastor.section.district',
        ]);

        $allOpenEvents = $this->openEvents();
        $registrationQuery = $this->registrationQuery($user);

        return Inertia::render('dashboard', [
            'dashboard' => [
                'role_name' => $user->roleName(),
                'hero' => $this->hero($user),
                'actions' => $this->actions($user),
                'links' => $this->links($user),
                'scope' => $this->scope($user),
                'metrics' => $this->metrics($user, count($allOpenEvents), $registrationQuery),
                'open_events' => array_slice($allOpenEvents, 0, 3),
                'recent_registrations' => $this->recentRegistrations($user, 3),
            ],
        ]);
    }

    /**
     * Build the hero content for the current user.
     *
     * @return array{eyebrow: string, title: string, description: string}
     */
    private function hero(User $user): array
    {
        return match (true) {
            $user->isAdmin() => [
                'eyebrow' => 'Admin overview',
                'title' => 'District registration command center',
                'description' => 'Monitor open events, active accounts, and cross-system registration activity from one workspace.',
            ],
            $user->isManager() => [
                'eyebrow' => 'Section overview',
                'title' => 'Section registration dashboard',
                'description' => 'Track registrations, assigned churches, and current event availability within your section.',
            ],
            $user->isRegistrationStaff() => [
                'eyebrow' => 'Onsite overview',
                'title' => 'Onsite registration workspace',
                'description' => 'Review your encoded transactions, payment mix, and open events before recording the next onsite entry.',
            ],
            default => [
                'eyebrow' => 'Church overview',
                'title' => 'Church registration dashboard',
                'description' => 'See open events, track recent submissions, and monitor verification progress for your assigned church account.',
            ],
        };
    }

    /**
     * Build the quick actions available on the dashboard.
     *
     * @return array<int, array{label: string, description: string, href: string}>
     */
    private function actions(User $user): array
    {
        if ($user->isAdmin()) {
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

        if ($user->isOnlineRegistrant() && $user->pastor_id !== null) {
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
        if ($user->isAdmin()) {
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

        if ($user->isOnlineRegistrant() && $user->pastor_id !== null) {
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
     * Build the scope summary shown on the dashboard.
     *
     * @return array{
     *     title: string,
     *     summary: string,
     *     description: string,
     *     items: array<int, array{label: string, value: string}>
     * }
     */
    private function scope(User $user): array
    {
        if ($user->isAdmin()) {
            return [
                'title' => 'Access scope',
                'summary' => 'All districts, sections, and church records',
                'description' => 'You can manage users, events, and registration activity across the full workspace.',
                'items' => [
                    ['label' => 'Role', 'value' => Role::ADMIN],
                    ['label' => 'Coverage', 'value' => 'System-wide'],
                    ['label' => 'Registrations', 'value' => 'All online and onsite transactions'],
                ],
            ];
        }

        if ($user->isManager()) {
            $sectionName = $user->section?->name ?? 'No section assigned';
            $districtName = $user->section?->district?->name ?? $user->district?->name ?? 'No district assigned';

            return [
                'title' => 'Access scope',
                'summary' => sprintf('%s, %s', $sectionName, $districtName),
                'description' => 'Your dashboard is limited to registrations and churches within your assigned section.',
                'items' => [
                    ['label' => 'Role', 'value' => Role::MANAGER],
                    ['label' => 'District', 'value' => $districtName],
                    ['label' => 'Section', 'value' => $sectionName],
                ],
            ];
        }

        if ($user->isRegistrationStaff()) {
            return [
                'title' => 'Access scope',
                'summary' => 'Personal onsite encoding workspace',
                'description' => 'Your activity blocks focus on the registrations you encoded while keeping current event availability in view.',
                'items' => [
                    ['label' => 'Role', 'value' => Role::REGISTRATION_STAFF],
                    ['label' => 'Registration scope', 'value' => 'Transactions encoded by you'],
                    ['label' => 'Lookup access', 'value' => 'All pastors and churches'],
                ],
            ];
        }

        $districtName = $user->pastor?->section?->district?->name ?? 'No district assigned';
        $sectionName = $user->pastor?->section?->name ?? 'No section assigned';
        $churchName = $user->pastor?->church_name ?? 'No church assigned';
        $pastorName = $user->pastor?->pastor_name ?? 'No pastor assigned';

        return [
            'title' => 'Access scope',
            'summary' => $churchName,
            'description' => 'Your dashboard is scoped to the church account assigned to your online registrant profile.',
            'items' => [
                ['label' => 'Role', 'value' => Role::ONLINE_REGISTRANT],
                ['label' => 'District', 'value' => $districtName],
                ['label' => 'Section', 'value' => $sectionName],
                ['label' => 'Pastor', 'value' => $pastorName],
            ],
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
                    'value' => User::query()->where('status', 'active')->count(),
                    'description' => 'Accounts with active workspace access',
                ],
                [
                    'label' => 'Active churches',
                    'value' => Pastor::query()->where('status', 'active')->count(),
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
    private function openEvents(): array
    {
        return Event::query()
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
            ->map(fn (Event $event): array => [
                'id' => $event->getKey(),
                'name' => $event->name,
                'venue' => $event->venue,
                'date_from' => $event->date_from->toDateString(),
                'date_to' => $event->date_to->toDateString(),
                'remaining_slots' => $event->remainingSlots(),
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

        if ($user->isAdmin()) {
            return $query;
        }

        if ($user->isManager()) {
            if ($user->section_id === null) {
                return $query->whereRaw('1 = 0');
            }

            return $query->whereHas('pastor', function (Builder $builder) use ($user): void {
                $builder->where('section_id', $user->section_id);
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
}
