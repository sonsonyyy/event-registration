<?php

namespace App\Policies;

use App\Models\Section;
use App\Models\User;

class SectionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAdminAccess() || ($user->isManager() && $user->section_id !== null);
    }

    public function view(User $user, Section $section): bool
    {
        return $user->canAccessSection($section);
    }

    public function create(User $user): bool
    {
        return $user->hasAdminAccess();
    }

    public function update(User $user, Section $section): bool
    {
        return $user->hasAdminAccess();
    }

    public function delete(User $user, Section $section): bool
    {
        return $user->hasAdminAccess();
    }
}
