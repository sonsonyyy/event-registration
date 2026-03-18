<?php

namespace App\Support;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class DepartmentScopeAccess
{
    private function __construct() {}

    public static function canAccessEvent(User $user, Event $event): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            return $event->isDistrictScoped()
                && self::matchesDepartmentScope($user, $event);
        }

        if ($user->isManager()) {
            return $user->section_id !== null
                && $event->isSectionScoped()
                && $event->section_id === $user->section_id
                && self::matchesDepartmentScope($user, $event);
        }

        if ($user->isRegistrationStaff()) {
            return true;
        }

        if ($user->isOnlineRegistrant()) {
            $sectionId = $user->section_id ?? $user->pastor?->section_id;

            if ($sectionId === null) {
                return false;
            }

            return $event->isDistrictScoped()
                || ($event->isSectionScoped() && $event->section_id === $sectionId);
        }

        return false;
    }

    public static function canAccessRegistrationRecord(User $user, Registration $registration): bool
    {
        if (! $registration->relationLoaded('event')) {
            $registration->load('event');
        }

        if ($user->isSuperAdmin() || $user->isAdmin() || $user->isManager()) {
            return self::canAccessEvent($user, $registration->event);
        }

        if ($user->isRegistrationStaff()) {
            return $registration->encoded_by_user_id === $user->getKey();
        }

        if ($user->isOnlineRegistrant()) {
            return $user->belongsToPastor($registration->pastor_id);
        }

        return false;
    }

    public static function canViewApprovalQueue(User $reviewer): bool
    {
        if ($reviewer->isSuperAdmin() || $reviewer->isAdmin()) {
            return true;
        }

        return $reviewer->isManager() && $reviewer->section_id !== null;
    }

    public static function canApproveRegistrantRequest(User $reviewer, User $accountRequest): bool
    {
        if (
            ! self::canViewApprovalQueue($reviewer)
            || ! $accountRequest->isOnlineRegistrant()
            || ! $accountRequest->isSelfServiceAccount()
        ) {
            return false;
        }

        if ($reviewer->isSuperAdmin()) {
            return true;
        }

        if ($reviewer->isAdmin()) {
            return $reviewer->district_id === null
                || $accountRequest->district_id === null
                || $reviewer->district_id === $accountRequest->district_id;
        }

        return $reviewer->section_id !== null
            && $accountRequest->section_id !== null
            && $reviewer->section_id === $accountRequest->section_id;
    }

    public static function scopeRegistrantApprovalQueue(Builder $query, User $reviewer): Builder
    {
        if ($reviewer->isSuperAdmin()) {
            return $query;
        }

        if ($reviewer->isAdmin()) {
            if ($reviewer->district_id !== null) {
                $query->where('district_id', $reviewer->district_id);
            }

            return $query;
        }

        if ($reviewer->isManager() && $reviewer->section_id !== null) {
            return $query->where('section_id', $reviewer->section_id);
        }

        return $query->whereRaw('1 = 0');
    }

    public static function approvalScopeSummary(User $reviewer): string
    {
        if ($reviewer->isSuperAdmin()) {
            return 'all districts';
        }

        if ($reviewer->isAdmin()) {
            $districtName = $reviewer->district?->name
                ?? $reviewer->district()->value('name');

            return $districtName !== null
                ? $districtName.' • all sections'
                : 'all sections';
        }

        $section = $reviewer->section()
            ->with('district')
            ->first();

        if ($section === null) {
            return 'your assigned scope';
        }

        return $section->district->name.' • '.$section->name;
    }

    public static function canViewVerificationQueue(User $reviewer): bool
    {
        if ($reviewer->isSuperAdmin() || $reviewer->isAdmin()) {
            return true;
        }

        return $reviewer->isManager() && $reviewer->section_id !== null;
    }

    public static function canAccessVerificationRegistration(User $reviewer, Registration $registration): bool
    {
        if (
            ! self::canViewVerificationQueue($reviewer)
            || $registration->registration_mode !== Registration::MODE_ONLINE
        ) {
            return false;
        }

        if (! $registration->relationLoaded('event')) {
            $registration->load('event');
        }

        $event = $registration->event;

        if ($reviewer->isSuperAdmin()) {
            return true;
        }

        if ($reviewer->isAdmin()) {
            return $event->isDistrictScoped()
                && self::matchesDepartmentScope($reviewer, $event);
        }

        return $reviewer->section_id !== null
            && $event->isSectionScoped()
            && $event->section_id === $reviewer->section_id
            && self::matchesDepartmentScope($reviewer, $event);
    }

    public static function canReviewRegistration(User $reviewer, Registration $registration): bool
    {
        return self::canAccessVerificationRegistration($reviewer, $registration)
            && $registration->canBeReviewed();
    }

    public static function scopeVerificationQueue(Builder $query, User $reviewer): Builder
    {
        if ($reviewer->isSuperAdmin()) {
            return $query;
        }

        if ($reviewer->isAdmin()) {
            return $query->whereHas('event', function (Builder $eventQuery) use ($reviewer): void {
                $eventQuery->where('scope_type', Event::SCOPE_DISTRICT);

                if ($reviewer->department_id !== null) {
                    $eventQuery->where('department_id', $reviewer->department_id);
                }
            });
        }

        if ($reviewer->isManager() && $reviewer->section_id !== null) {
            return $query->whereHas('event', function (Builder $eventQuery) use ($reviewer): void {
                $eventQuery
                    ->where('scope_type', Event::SCOPE_SECTION)
                    ->where('section_id', $reviewer->section_id);

                if ($reviewer->department_id !== null) {
                    $eventQuery->where('department_id', $reviewer->department_id);
                }
            });
        }

        return $query->whereRaw('1 = 0');
    }

    public static function scopeAccessibleEvents(Builder $query, User $user): Builder
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        if ($user->isAdmin()) {
            $query->where('scope_type', Event::SCOPE_DISTRICT);

            if ($user->department_id !== null) {
                $query->where('department_id', $user->department_id);
            }

            return $query;
        }

        if ($user->isManager()) {
            if ($user->section_id === null) {
                return $query->whereRaw('1 = 0');
            }

            $query
                ->where('scope_type', Event::SCOPE_SECTION)
                ->where('section_id', $user->section_id);

            if ($user->department_id !== null) {
                $query->where('department_id', $user->department_id);
            }

            return $query;
        }

        if ($user->isRegistrationStaff()) {
            return $query;
        }

        if ($user->isOnlineRegistrant()) {
            $sectionId = $user->section_id ?? $user->pastor?->section_id;

            if ($sectionId === null) {
                return $query->whereRaw('1 = 0');
            }

            return $query->where(function (Builder $eventQuery) use ($sectionId): void {
                $eventQuery
                    ->where('scope_type', Event::SCOPE_DISTRICT)
                    ->orWhere(function (Builder $sectionEventQuery) use ($sectionId): void {
                        $sectionEventQuery
                            ->where('scope_type', Event::SCOPE_SECTION)
                            ->where('section_id', $sectionId);
                    });
            });
        }

        return $query->whereRaw('1 = 0');
    }

    public static function verificationScopeSummary(User $reviewer): string
    {
        if ($reviewer->isSuperAdmin()) {
            return 'all events and departments';
        }

        if ($reviewer->isAdmin()) {
            return 'district events • '.self::departmentScopeLabel($reviewer);
        }

        $section = $reviewer->section()
            ->with('district')
            ->first();

        if ($section === null) {
            return 'your assigned scope';
        }

        return $section->district->name
            .' • '
            .$section->name
            .' • '
            .self::departmentScopeLabel($reviewer);
    }

    private static function matchesDepartmentScope(User $reviewer, Event $event): bool
    {
        return $reviewer->department_id === null
            || $reviewer->department_id === $event->department_id;
    }

    private static function departmentScopeLabel(User $reviewer): string
    {
        if ($reviewer->department_id === null) {
            return 'all departments';
        }

        return $reviewer->department?->name
            ?? $reviewer->department()->value('name')
            ?? 'assigned department';
    }
}
