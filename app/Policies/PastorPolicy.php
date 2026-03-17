<?php

namespace App\Policies;

use App\Models\Pastor;
use App\Models\Role;
use App\Models\User;

class PastorPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAdminAccess()
            || $user->hasAnyRole(Role::MANAGER, Role::REGISTRATION_STAFF);
    }

    public function view(User $user, Pastor $pastor): bool
    {
        return $user->canAccessPastor($pastor);
    }

    public function create(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function update(User $user, Pastor $pastor): bool
    {
        return $user->hasAdminAccess();
    }

    public function delete(User $user, Pastor $pastor): bool
    {
        return $user->hasAdminAccess();
    }
}
