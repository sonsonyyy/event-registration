<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\Role;
use App\Models\User;

class EventPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(
            Role::MANAGER,
            Role::REGISTRATION_STAFF,
            Role::ONLINE_REGISTRANT,
        );
    }

    public function view(User $user, Event $event): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Event $event): bool
    {
        return false;
    }

    public function delete(User $user, Event $event): bool
    {
        return false;
    }
}
