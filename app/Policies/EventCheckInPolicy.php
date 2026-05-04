<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\EventCheckIn;
use App\Models\Pastor;
use App\Models\User;
use App\Support\DepartmentScopeAccess;

class EventCheckInPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin()
            || ($user->isAdmin() && $user->district_id !== null)
            || ($user->isManager() && $user->section_id !== null)
            || ($user->isRegistrationStaff() && $user->district_id !== null);
    }

    public function view(User $user, EventCheckIn $eventCheckIn): bool
    {
        return DepartmentScopeAccess::canAccessEventCheckInRecord($user, $eventCheckIn);
    }

    public function create(User $user, ?Pastor $pastor = null, ?Event $event = null): bool
    {
        if ($pastor !== null && $event !== null) {
            return DepartmentScopeAccess::canProcessEventCheckIn($user, $pastor, $event);
        }

        if ($pastor !== null) {
            return DepartmentScopeAccess::canAccessPastorForOnsiteScope($user, $pastor);
        }

        return $this->viewAny($user);
    }
}
