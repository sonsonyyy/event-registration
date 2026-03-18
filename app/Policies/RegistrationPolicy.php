<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\Role;
use App\Models\User;
use App\Support\DepartmentScopeAccess;

class RegistrationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(
            Role::MANAGER,
            Role::REGISTRATION_STAFF,
            Role::ONLINE_REGISTRANT,
        );
    }

    public function viewAnyOnsite(User $user): bool
    {
        return $user->isRegistrationStaff()
            || ($user->isManager() && $user->section_id !== null);
    }

    public function viewAnyOnline(User $user): bool
    {
        return $user->hasApprovedOnlineRegistrationAccess();
    }

    public function viewAnyVerification(User $user): bool
    {
        return $user->canViewVerificationQueue();
    }

    public function view(User $user, Registration $registration): bool
    {
        return $user->canAccessRegistration($registration);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, Registration $registration): bool
    {
        if ($user->isManager()) {
            return $user->canAccessRegistration($registration);
        }

        if ($user->isRegistrationStaff()) {
            return $registration->registration_mode === Registration::MODE_ONSITE
                && $registration->encoded_by_user_id === $user->getKey();
        }

        return false;
    }

    public function updateOnsite(User $user, Registration $registration): bool
    {
        if (! $registration->canBeUpdatedOnsite()) {
            return false;
        }

        if ($user->isManager()) {
            return $user->canAccessRegistration($registration);
        }

        if ($user->isRegistrationStaff()) {
            return $registration->encoded_by_user_id === $user->getKey();
        }

        return false;
    }

    public function updateOnline(User $user, Registration $registration): bool
    {
        return $registration->canBeCorrectedOnline()
            && $registration->registration_mode === Registration::MODE_ONLINE
            && $user->hasApprovedOnlineRegistrationAccess()
            && $user->belongsToPastor($registration->pastor_id);
    }

    public function cancelOnline(User $user, Registration $registration): bool
    {
        return $registration->canBeCancelledOnline()
            && $registration->registration_mode === Registration::MODE_ONLINE
            && $user->hasApprovedOnlineRegistrationAccess()
            && $user->belongsToPastor($registration->pastor_id);
    }

    public function delete(User $user, Registration $registration): bool
    {
        return $user->isManager() && $user->canAccessRegistration($registration);
    }

    public function createOnsite(User $user, ?Pastor $pastor = null, ?Event $event = null): bool
    {
        if ($event !== null && ! DepartmentScopeAccess::canAccessEvent($user, $event)) {
            return false;
        }

        if ($user->isRegistrationStaff()) {
            return true;
        }

        if ($user->isManager()) {
            if ($pastor === null) {
                return $user->section_id !== null;
            }

            return $user->managesSection($pastor->section_id);
        }

        return false;
    }

    public function createOnline(User $user, Pastor $pastor, ?Event $event = null): bool
    {
        return $user->hasApprovedOnlineRegistrationAccess()
            && $user->belongsToPastor($pastor->getKey())
            && ($event === null || DepartmentScopeAccess::canAccessEvent($user, $event));
    }

    public function uploadReceipt(User $user, Registration $registration): bool
    {
        return $registration->registration_mode === Registration::MODE_ONLINE
            && $user->belongsToPastor($registration->pastor_id);
    }

    public function verifyReceipt(User $user, Registration $registration): bool
    {
        return $user->canReviewRegistration($registration);
    }

    public function viewVerificationReceipt(User $user, Registration $registration): bool
    {
        return $user->canAccessVerificationRegistration($registration);
    }
}
