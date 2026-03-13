<?php

namespace App\Policies;

use App\Models\Pastor;
use App\Models\Registration;
use App\Models\Role;
use App\Models\User;

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
            return $registration->registration_mode === 'onsite'
                && $registration->encoded_by_user_id === $user->getKey();
        }

        return false;
    }

    public function delete(User $user, Registration $registration): bool
    {
        return $user->isManager() && $user->canAccessRegistration($registration);
    }

    public function createOnsite(User $user, Pastor $pastor): bool
    {
        if ($user->isRegistrationStaff()) {
            return true;
        }

        if ($user->isManager()) {
            return $user->managesSection($pastor->section_id);
        }

        return false;
    }

    public function createOnline(User $user, Pastor $pastor): bool
    {
        return $user->belongsToPastor($pastor->getKey());
    }

    public function uploadReceipt(User $user, Registration $registration): bool
    {
        return $registration->registration_mode === 'online'
            && $user->belongsToPastor($registration->pastor_id);
    }

    public function verifyReceipt(User $user, Registration $registration): bool
    {
        return $user->isManager()
            && $registration->registration_mode === 'online'
            && $user->canAccessRegistration($registration);
    }
}
