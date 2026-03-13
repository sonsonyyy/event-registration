<?php

namespace App\Policies;

use App\Models\District;
use App\Models\User;

class DistrictPolicy
{
    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, District $district): bool
    {
        return false;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, District $district): bool
    {
        return false;
    }

    public function delete(User $user, District $district): bool
    {
        return false;
    }
}
