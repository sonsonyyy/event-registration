<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexRegistrantApprovalRequest;
use App\Http\Requests\UpdateRegistrantApprovalRequest;
use App\Models\Role;
use App\Models\User;
use App\Support\DepartmentScopeAccess;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegistrantApprovalController extends Controller
{
    public function index(IndexRegistrantApprovalRequest $request): Response
    {
        Gate::authorize('viewAnyApprovalQueue', User::class);

        $reviewer = $request->user();
        $filters = $request->filters();
        $requests = $this->approvalQuery($reviewer, $filters['search'], $filters['status'])
            ->paginate($filters['per_page'])
            ->withQueryString();

        return Inertia::render('account-requests/index', [
            'scopeSummary' => $this->scopeSummary($reviewer),
            'summary' => $this->summaryData($reviewer),
            'requests' => [
                'data' => $requests->getCollection()
                    ->map(fn (User $user): array => $this->requestData($user))
                    ->values()
                    ->all(),
                'meta' => [
                    'current_page' => $requests->currentPage(),
                    'last_page' => $requests->lastPage(),
                    'per_page' => $requests->perPage(),
                    'from' => $requests->firstItem(),
                    'to' => $requests->lastItem(),
                    'total' => $requests->total(),
                ],
            ],
            'filters' => $filters,
            'statusOptions' => $this->statusOptions(),
            'perPageOptions' => [10, 25, 50],
        ]);
    }

    public function update(UpdateRegistrantApprovalRequest $request, User $user): RedirectResponse
    {
        $decision = $request->decision();

        DB::transaction(function () use ($request, $user, $decision): void {
            $accountRequest = User::query()
                ->with([
                    'role:id,name',
                    'pastor.section.district',
                ])
                ->lockForUpdate()
                ->findOrFail($user->getKey());

            Gate::authorize('reviewRegistrantRequest', $accountRequest);

            if (! $accountRequest->isOnlineRegistrant() || ! $accountRequest->isSelfServiceAccount()) {
                throw ValidationException::withMessages([
                    'decision' => 'Only self-service registrant requests can be reviewed from this page.',
                ]);
            }

            if (
                $decision === User::APPROVAL_APPROVED
                && $this->pastorHasReachedRegistrantLimit($accountRequest)
            ) {
                throw ValidationException::withMessages([
                    'decision' => 'This church already has the maximum of 2 active or pending registrant accounts.',
                ]);
            }

            $accountRequest->forceFill([
                'approval_status' => $decision,
                'approval_reviewed_by_user_id' => $request->user()->getKey(),
                'approval_reviewed_at' => now(),
            ])->save();
        });

        return back()->with(
            'success',
            $decision === User::APPROVAL_APPROVED
                ? 'Registrant account approved successfully.'
                : 'Registrant account rejected successfully.',
        );
    }

    private function approvalQuery(User $reviewer, string $search, string $status): Builder
    {
        $query = User::query()
            ->where('account_source', User::ACCOUNT_SOURCE_SELF_SERVICE)
            ->whereHas('role', function (Builder $roleQuery): void {
                $roleQuery->where('name', Role::ONLINE_REGISTRANT);
            })
            ->with([
                'approvalReviewer:id,name',
                'pastor:id,pastor_name,church_name,section_id',
                'pastor.section:id,name,district_id',
                'pastor.section.district:id,name',
            ])
            ->orderByRaw(
                'case when approval_status = ? then 0 when approval_status = ? then 1 when approval_status = ? then 2 else 3 end',
                [
                    User::APPROVAL_PENDING,
                    User::APPROVAL_APPROVED,
                    User::APPROVAL_REJECTED,
                ],
            )
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        DepartmentScopeAccess::scopeRegistrantApprovalQueue($query, $reviewer);

        if ($status !== 'all') {
            $query->where('approval_status', $status);
        }

        if ($search !== '') {
            $like = '%'.$search.'%';

            $query->where(function (Builder $searchQuery) use ($like): void {
                $searchQuery
                    ->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhereHas('pastor', function (Builder $pastorQuery) use ($like): void {
                        $pastorQuery
                            ->where('church_name', 'like', $like)
                            ->orWhere('pastor_name', 'like', $like)
                            ->orWhere('contact_number', 'like', $like)
                            ->orWhere('email', 'like', $like);
                    })
                    ->orWhereHas('pastor.section', function (Builder $sectionQuery) use ($like): void {
                        $sectionQuery->where('name', 'like', $like);
                    })
                    ->orWhereHas('pastor.section.district', function (Builder $districtQuery) use ($like): void {
                        $districtQuery->where('name', 'like', $like);
                    });
            });
        }

        return $query;
    }

    /**
     * Build summary counts for the scoped approval queue.
     *
     * @return array{pending: int, approved: int, rejected: int}
     */
    private function summaryData(User $reviewer): array
    {
        $query = User::query()
            ->where('account_source', User::ACCOUNT_SOURCE_SELF_SERVICE)
            ->whereHas('role', function (Builder $roleQuery): void {
                $roleQuery->where('name', Role::ONLINE_REGISTRANT);
            });

        DepartmentScopeAccess::scopeRegistrantApprovalQueue($query, $reviewer);

        return [
            'pending' => (clone $query)
                ->where('approval_status', User::APPROVAL_PENDING)
                ->count(),
            'approved' => (clone $query)
                ->where('approval_status', User::APPROVAL_APPROVED)
                ->count(),
            'rejected' => (clone $query)
                ->where('approval_status', User::APPROVAL_REJECTED)
                ->count(),
        ];
    }

    private function scopeSummary(User $reviewer): string
    {
        return DepartmentScopeAccess::approvalScopeSummary($reviewer);
    }

    /**
     * Transform a scoped account request record for the queue.
     *
     * @return array<string, mixed>
     */
    private function requestData(User $user): array
    {
        return [
            'id' => $user->getKey(),
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'approval_status' => $user->approval_status,
            'created_at' => $user->created_at?->toIso8601String(),
            'approval_reviewed_at' => $user->approval_reviewed_at?->toIso8601String(),
            'approval_reviewer' => $user->approvalReviewer ? [
                'id' => $user->approvalReviewer->getKey(),
                'name' => $user->approvalReviewer->name,
            ] : null,
            'pastor' => $user->pastor ? [
                'id' => $user->pastor->getKey(),
                'pastor_name' => $user->pastor->pastor_name,
                'church_name' => $user->pastor->church_name,
                'section_name' => $user->pastor->section?->name,
                'district_name' => $user->pastor->section?->district?->name,
            ] : null,
        ];
    }

    /**
     * Build the status filter options used on the approval queue.
     *
     * @return array<int, array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return [
            [
                'value' => User::APPROVAL_PENDING,
                'label' => 'Pending',
            ],
            [
                'value' => User::APPROVAL_APPROVED,
                'label' => 'Approved',
            ],
            [
                'value' => User::APPROVAL_REJECTED,
                'label' => 'Rejected',
            ],
            [
                'value' => 'all',
                'label' => 'All requests',
            ],
        ];
    }

    private function pastorHasReachedRegistrantLimit(User $accountRequest): bool
    {
        return User::query()
            ->whereKeyNot($accountRequest->getKey())
            ->where('pastor_id', $accountRequest->pastor_id)
            ->where('status', User::STATUS_ACTIVE)
            ->whereIn('approval_status', User::REGISTRANT_OCCUPYING_APPROVAL_STATUSES)
            ->whereHas('role', function (Builder $roleQuery): void {
                $roleQuery->where('name', Role::ONLINE_REGISTRANT);
            })
            ->count() >= User::MAX_REGISTRANT_ACCOUNTS_PER_PASTOR;
    }
}
