<?php

namespace App\Policies;

use App\Models\District;
use App\Models\User;

class DistrictPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function view(User $user, District $district): bool
    {
        return $user->hasAdminAccess();
    }

    public function create(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function update(User $user, District $district): bool
    {
        return $user->hasAdminAccess();
    }

    public function delete(User $user, District $district): bool
    {
        return $user->hasAdminAccess();
    }
}
