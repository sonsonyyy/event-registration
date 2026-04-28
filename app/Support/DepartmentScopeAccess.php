<?php

namespace App\Support;

use App\Models\Event;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\Section;
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
            return $user->district_id !== null
                && $event->isDistrictScoped()
                && $event->district_id === $user->district_id
                && self::matchesDepartmentScope($user, $event);
        }

        if ($user->isManager()) {
            $managerDistrictId = self::managerDistrictId($user);

            return $user->section_id !== null
                && self::matchesDepartmentScope($user, $event)
                && (
                    ($event->isDistrictScoped() && $managerDistrictId !== null && $event->district_id === $managerDistrictId)
                    || ($event->isSectionScoped() && $event->section_id === $user->section_id)
                );
        }

        if ($user->isRegistrationStaff()) {
            return self::canAccessEventAsRegistrationStaff($user, $event);
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
        $registration->loadMissing('event.section', 'pastor.section');

        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            return self::adminCanProcessDistrictRegistration($user, $registration);
        }

        if ($user->isManager()) {
            return self::managerCanProcessSectionRegistration($user, $registration);
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
        return $reviewer->isSuperAdmin()
            || ($reviewer->isAdmin() && $reviewer->district_id !== null)
            || ($reviewer->isManager() && $reviewer->section_id !== null);
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
            return $reviewer->district_id !== null
                && self::approvalDistrictId($accountRequest) === $reviewer->district_id;
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

        if ($reviewer->isAdmin() && $reviewer->district_id !== null) {
            return $query->where('district_id', $reviewer->district_id);
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
                ? $districtName.' • All sections'
                : 'your assigned district';
        }

        $section = $reviewer->section()
            ->with('district')
            ->first();

        if ($section === null) {
            return 'your assigned scope';
        }

        return $section->district->name.' • '.$section->name;
    }

    private static function approvalDistrictId(User $accountRequest): ?int
    {
        return $accountRequest->district_id
            ?? $accountRequest->section?->district_id
            ?? $accountRequest->section()->value('district_id')
            ?? $accountRequest->pastor?->section?->district_id
            ?? $accountRequest->pastor()->with('section:id,district_id')->first()?->section?->district_id;
    }

    public static function canViewVerificationQueue(User $reviewer): bool
    {
        if ($reviewer->isSuperAdmin()) {
            return true;
        }

        if ($reviewer->isAdmin()) {
            return $reviewer->district_id !== null;
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

        $registration->loadMissing('event.section', 'pastor.section');

        if ($reviewer->isSuperAdmin()) {
            return true;
        }

        if ($reviewer->isAdmin()) {
            return self::adminCanProcessDistrictRegistration($reviewer, $registration);
        }

        return self::managerCanProcessSectionRegistration($reviewer, $registration);
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
            if ($reviewer->district_id === null) {
                return $query->whereRaw('1 = 0');
            }

            return $query
                ->whereHas('event', function (Builder $eventQuery) use ($reviewer): void {
                    $eventQuery
                        ->where('scope_type', Event::SCOPE_DISTRICT)
                        ->where('district_id', $reviewer->district_id);
                    self::applyStrictDepartmentScope($eventQuery, $reviewer);
                })
                ->whereHas('pastor.section', function (Builder $sectionQuery) use ($reviewer): void {
                    $sectionQuery->where('district_id', $reviewer->district_id);
                });
        }

        if ($reviewer->isManager() && $reviewer->section_id !== null) {
            $managerDistrictId = self::managerDistrictId($reviewer);

            return $query
                ->whereHas('pastor', function (Builder $pastorQuery) use ($reviewer): void {
                    $pastorQuery->where('section_id', $reviewer->section_id);
                })
                ->whereHas('event', function (Builder $eventQuery) use ($reviewer, $managerDistrictId): void {
                    self::applyStrictDepartmentScope($eventQuery, $reviewer);

                    $eventQuery->where(function (Builder $scopedEventQuery) use ($reviewer, $managerDistrictId): void {
                        $scopedEventQuery = $scopedEventQuery
                            ->where(function (Builder $districtEventQuery) use ($managerDistrictId): void {
                                $districtEventQuery
                                    ->where('scope_type', Event::SCOPE_DISTRICT);

                                if ($managerDistrictId !== null) {
                                    $districtEventQuery->where('district_id', $managerDistrictId);
                                } else {
                                    $districtEventQuery->whereRaw('1 = 0');
                                }
                            })
                            ->orWhere(function (Builder $sectionEventQuery) use ($reviewer): void {
                                $sectionEventQuery
                                    ->where('scope_type', Event::SCOPE_SECTION)
                                    ->where('section_id', $reviewer->section_id);
                            });
                    });
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
            if ($user->district_id === null) {
                return $query->whereRaw('1 = 0');
            }

            self::applyStrictDepartmentScope($query, $user);

            return $query
                ->where('scope_type', Event::SCOPE_DISTRICT)
                ->where('district_id', $user->district_id);
        }

        if ($user->isManager()) {
            if ($user->section_id === null) {
                return $query->whereRaw('1 = 0');
            }

            $managerDistrictId = self::managerDistrictId($user);

            self::applyStrictDepartmentScope($query, $user);

            return $query->where(function (Builder $eventQuery) use ($user, $managerDistrictId): void {
                $eventQuery = $eventQuery
                    ->where(function (Builder $districtEventQuery) use ($managerDistrictId): void {
                        $districtEventQuery
                            ->where('scope_type', Event::SCOPE_DISTRICT);

                        if ($managerDistrictId !== null) {
                            $districtEventQuery->where('district_id', $managerDistrictId);

                            return;
                        }

                        $districtEventQuery->whereRaw('1 = 0');
                    })
                    ->orWhere(function (Builder $sectionEventQuery) use ($user): void {
                        $sectionEventQuery
                            ->where('scope_type', Event::SCOPE_SECTION)
                            ->where('section_id', $user->section_id);
                    });
            });
        }

        if ($user->isRegistrationStaff()) {
            if ($user->district_id === null) {
                return $query->whereRaw('1 = 0');
            }

            self::applyStrictDepartmentScope($query, $user);

            return $query->where(function (Builder $eventQuery) use ($user): void {
                $eventQuery
                    ->where('scope_type', Event::SCOPE_DISTRICT)
                    ->orWhere(function (Builder $sectionEventQuery) use ($user): void {
                        $sectionEventQuery->where('scope_type', Event::SCOPE_SECTION);

                        if ($user->section_id !== null) {
                            $sectionEventQuery->where('section_id', $user->section_id);

                            return;
                        }

                        $sectionEventQuery->whereHas('section', function (Builder $sectionQuery) use ($user): void {
                            $sectionQuery->where('district_id', $user->district_id);
                        });
                    });
            });
        }

        if ($user->isOnlineRegistrant()) {
            $sectionId = $user->section_id ?? $user->pastor?->section_id;

            if ($sectionId === null) {
                return $query->whereRaw('1 = 0');
            }

            $districtId = $user->district_id ?? $user->pastor?->section?->district_id;

            return $query->where(function (Builder $eventQuery) use ($sectionId, $districtId): void {
                $eventQuery
                    ->where(function (Builder $districtEventQuery) use ($districtId): void {
                        $districtEventQuery->where('scope_type', Event::SCOPE_DISTRICT);

                        if ($districtId !== null) {
                            $districtEventQuery->where('district_id', $districtId);

                            return;
                        }

                        $districtEventQuery->whereRaw('1 = 0');
                    })
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
            $districtName = $reviewer->district?->name
                ?? $reviewer->district()->value('name');

            return $districtName !== null
                ? $districtName.' • district events • '.self::departmentScopeLabel($reviewer)
                : 'district events • '.self::departmentScopeLabel($reviewer);
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

    public static function canPostOnsiteRegistration(User $user, Pastor $pastor, Event $event): bool
    {
        $pastor->loadMissing('section');

        if ($user->isSuperAdmin()) {
            return true;
        }

        if (! self::matchesDepartmentScope($user, $event)) {
            return false;
        }

        if ($user->isAdmin()) {
            return $user->district_id !== null
                && $event->isDistrictScoped()
                && $event->district_id === $user->district_id
                && $pastor->section?->district_id === $user->district_id;
        }

        if ($user->isManager()) {
            $managerDistrictId = self::managerDistrictId($user);

            return $user->section_id !== null
                && $pastor->section_id === $user->section_id
                && (
                    ($event->isDistrictScoped() && $managerDistrictId !== null && $event->district_id === $managerDistrictId)
                    || ($event->isSectionScoped() && $event->section_id === $user->section_id)
                );
        }

        if ($user->isRegistrationStaff()) {
            if (! self::canAccessPastorForOnsiteScope($user, $pastor)) {
                return false;
            }

            if ($event->isDistrictScoped()) {
                return $event->district_id === $user->district_id;
            }

            if ($user->section_id !== null) {
                return $event->section_id === $user->section_id;
            }

            $event->loadMissing('section');

            return $event->section?->district_id === $user->district_id;
        }

        return false;
    }

    public static function canAccessPastorForOnsiteScope(User $user, Pastor $pastor): bool
    {
        $pastor->loadMissing('section');

        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            return $user->district_id !== null
                && $pastor->section?->district_id === $user->district_id;
        }

        if ($user->isManager()) {
            return $user->section_id !== null
                && $pastor->section_id === $user->section_id;
        }

        if ($user->isRegistrationStaff()) {
            if (
                $user->district_id === null
                || $pastor->section?->district_id !== $user->district_id
            ) {
                return false;
            }

            return $user->section_id === null
                || $pastor->section_id === $user->section_id;
        }

        return false;
    }

    private static function adminCanProcessDistrictRegistration(User $user, Registration $registration): bool
    {
        $event = $registration->event;
        $pastor = $registration->pastor;

        return $user->district_id !== null
            && $event->isDistrictScoped()
            && $event->district_id === $user->district_id
            && self::matchesDepartmentScope($user, $event)
            && $pastor?->section?->district_id === $user->district_id;
    }

    private static function managerCanProcessSectionRegistration(User $user, Registration $registration): bool
    {
        $event = $registration->event;
        $pastor = $registration->pastor;
        $managerDistrictId = self::managerDistrictId($user);

        return $user->section_id !== null
            && $pastor?->section_id === $user->section_id
            && self::matchesDepartmentScope($user, $event)
            && (
                ($event->isDistrictScoped() && $managerDistrictId !== null && $event->district_id === $managerDistrictId)
                || ($event->isSectionScoped() && $event->section_id === $user->section_id)
            );
    }

    private static function canAccessEventAsRegistrationStaff(User $user, Event $event): bool
    {
        if (
            $user->district_id === null
            || ! self::matchesDepartmentScope($user, $event)
        ) {
            return false;
        }

        if ($event->isDistrictScoped()) {
            return $event->district_id === $user->district_id;
        }

        if ($user->section_id !== null) {
            return $event->section_id === $user->section_id;
        }

        $event->loadMissing('section');

        return $event->section?->district_id === $user->district_id;
    }

    private static function matchesDepartmentScope(User $reviewer, Event $event): bool
    {
        return $reviewer->department_id === $event->department_id;
    }

    public static function canManageEventRecord(User $user, Event $event): bool
    {
        $event->loadMissing('section');

        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            return $user->district_id !== null
                && $event->isDistrictScoped()
                && $event->district_id === $user->district_id
                && self::matchesDepartmentScope($user, $event);
        }

        if ($user->isManager()) {
            return $user->section_id !== null
                && $event->isSectionScoped()
                && $event->section_id === $user->section_id
                && self::matchesDepartmentScope($user, $event);
        }

        return false;
    }

    public static function canManageProposedEvent(
        User $user,
        string $scopeType,
        ?int $districtId,
        ?Section $section,
        ?int $departmentId,
    ): bool {
        if ($scopeType === Event::SCOPE_DISTRICT) {
            if ($districtId === null || $section !== null) {
                return false;
            }
        }

        if ($scopeType === Event::SCOPE_SECTION) {
            if ($section === null) {
                return false;
            }

            if ($districtId !== null && $districtId !== $section->district_id) {
                return false;
            }
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            return $scopeType === Event::SCOPE_DISTRICT
                && $user->district_id !== null
                && $districtId === $user->district_id
                && $user->department_id === $departmentId;
        }

        if ($user->isManager()) {
            return $scopeType === Event::SCOPE_SECTION
                && $user->section_id !== null
                && $section?->getKey() === $user->section_id
                && $user->department_id === $departmentId;
        }

        return false;
    }

    public static function scopeManageableEvents(Builder $query, User $user): Builder
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        if ($user->isAdmin() && $user->district_id !== null) {
            self::applyStrictDepartmentScope($query, $user);

            return $query
                ->where('scope_type', Event::SCOPE_DISTRICT)
                ->where('district_id', $user->district_id);
        }

        if ($user->isManager() && $user->section_id !== null) {
            self::applyStrictDepartmentScope($query, $user);

            return $query
                ->where('scope_type', Event::SCOPE_SECTION)
                ->where('section_id', $user->section_id);
        }

        return $query->whereRaw('1 = 0');
    }

    private static function applyStrictDepartmentScope(Builder $query, User $user): void
    {
        if ($user->department_id === null) {
            $query->whereNull('department_id');

            return;
        }

        $query->where('department_id', $user->department_id);
    }

    private static function departmentScopeLabel(User $reviewer): string
    {
        return $reviewer->department?->name
            ?? $reviewer->department()->value('name')
            ?? 'No department';
    }

    private static function managerDistrictId(User $user): ?int
    {
        return $user->district_id
            ?? $user->section?->district_id
            ?? $user->section()->value('district_id');
    }
}
