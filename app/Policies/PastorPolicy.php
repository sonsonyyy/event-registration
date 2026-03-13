<?php

namespace App\Policies;

use App\Models\Pastor;
use App\Models\Role;
use App\Models\User;

class PastorPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(Role::ADMIN, Role::MANAGER, Role::REGISTRATION_STAFF);
    }

    public function view(User $user, Pastor $pastor): bool
    {
        return $user->canAccessPastor($pastor);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Pastor $pastor): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Pastor $pastor): bool
    {
        return $user->isAdmin();
    }
}
