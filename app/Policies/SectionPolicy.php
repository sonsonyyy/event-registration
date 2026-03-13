<?php

namespace App\Policies;

use App\Models\Section;
use App\Models\User;

class SectionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isManager() && $user->section_id !== null;
    }

    public function view(User $user, Section $section): bool
    {
        return $user->canAccessSection($section);
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Section $section): bool
    {
        return false;
    }

    public function delete(User $user, Section $section): bool
    {
        return false;
    }
}
