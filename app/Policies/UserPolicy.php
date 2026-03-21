<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function view(User $user, User $model): bool
    {
        return $this->canManageDistrictUser($user, $model);
    }

    public function create(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function update(User $user, User $model): bool
    {
        return $this->canManageDistrictUser($user, $model);
    }

    public function delete(User $user, User $model): bool
    {
        return $this->canManageDistrictUser($user, $model);
    }

    public function viewAnyApprovalQueue(User $user): bool
    {
        return $user->canViewRegistrantApprovalQueue();
    }

    public function reviewRegistrantRequest(User $user, User $model): bool
    {
        return $user->canApproveRegistrantRequest($model);
    }

    private function canManageDistrictUser(User $user, User $model): bool
    {
        if (! $user->isAdmin() || $model->isSuperAdmin()) {
            return false;
        }

        if ($user->district_id === null) {
            return false;
        }

        return $this->resolveScopedDistrictId($model) === $user->district_id;
    }

    private function resolveScopedDistrictId(User $user): ?int
    {
        return $user->district_id
            ?? $user->section?->district_id
            ?? $user->section()->value('district_id')
            ?? $user->pastor?->section?->district_id
            ?? $user->pastor()?->with('section:id,district_id')->first()?->section?->district_id;
    }
}
