<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    public function viewAnyApprovalQueue(User $user): bool
    {
        return $user->isManager() && $user->section_id !== null;
    }

    public function reviewRegistrantRequest(User $user, User $model): bool
    {
        return $user->isManager()
            && $model->isOnlineRegistrant()
            && $model->isSelfServiceAccount()
            && $model->section_id !== null
            && $user->managesSection($model->section_id);
    }
}
