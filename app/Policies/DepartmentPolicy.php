<?php

namespace App\Policies;

use App\Models\Department;
use App\Models\User;

class DepartmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function view(User $user, Department $department): bool
    {
        return $user->hasAdminAccess();
    }

    public function create(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function update(User $user, Department $department): bool
    {
        return $user->hasAdminAccess();
    }

    public function delete(User $user, Department $department): bool
    {
        return $user->hasAdminAccess();
    }
}
