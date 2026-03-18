<?php

namespace App\Support;

use App\Models\Registration;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationRecipientResolver
{
    /**
     * @return Collection<int, User>
     */
    public function reviewersForRegistrantAccessRequest(User $accountRequest): Collection
    {
        $accountRequest->loadMissing('pastor.section.district');

        return $this->reviewerCandidates()
            ->filter(fn (User $reviewer): bool => $reviewer->canApproveRegistrantRequest($accountRequest))
            ->values();
    }

    public function registrantForRegistrantAccessRequest(User $accountRequest): ?User
    {
        return $accountRequest->isOnlineRegistrant() ? $accountRequest : null;
    }

    /**
     * @return Collection<int, User>
     */
    public function reviewersForRegistration(Registration $registration): Collection
    {
        $registration->loadMissing('event', 'pastor.section.district', 'encodedByUser.role');

        return $this->reviewerCandidates()
            ->filter(fn (User $reviewer): bool => $reviewer->canAccessVerificationRegistration($registration))
            ->values();
    }

    public function registrantForRegistration(Registration $registration): ?User
    {
        $registration->loadMissing('encodedByUser.role');

        $encodedByUser = $registration->encodedByUser;

        if (! $encodedByUser instanceof User) {
            return null;
        }

        return $encodedByUser->isOnlineRegistrant() ? $encodedByUser : null;
    }

    /**
     * @return Collection<int, User>
     */
    private function reviewerCandidates(): Collection
    {
        return User::query()
            ->with('role')
            ->where('status', User::STATUS_ACTIVE)
            ->whereHas('role', function ($query): void {
                $query->whereIn('name', [
                    Role::SUPER_ADMIN,
                    Role::ADMIN,
                    Role::MANAGER,
                ]);
            })
            ->get();
    }
}
