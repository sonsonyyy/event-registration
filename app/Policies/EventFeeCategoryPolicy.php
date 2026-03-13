<?php

namespace App\Policies;

use App\Models\EventFeeCategory;
use App\Models\Role;
use App\Models\User;

class EventFeeCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(
            Role::MANAGER,
            Role::REGISTRATION_STAFF,
            Role::ONLINE_REGISTRANT,
        );
    }

    public function view(User $user, EventFeeCategory $eventFeeCategory): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, EventFeeCategory $eventFeeCategory): bool
    {
        return false;
    }

    public function delete(User $user, EventFeeCategory $eventFeeCategory): bool
    {
        return false;
    }
}
