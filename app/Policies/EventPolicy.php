<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use App\Support\DepartmentScopeAccess;

class EventPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin()
            || ($user->isAdmin() && $user->district_id !== null)
            || ($user->isManager() && $user->section_id !== null);
    }

    public function view(User $user, Event $event): bool
    {
        return DepartmentScopeAccess::canManageEventRecord($user, $event);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, Event $event): bool
    {
        return DepartmentScopeAccess::canManageEventRecord($user, $event);
    }

    public function delete(User $user, Event $event): bool
    {
        return DepartmentScopeAccess::canManageEventRecord($user, $event);
    }
}
