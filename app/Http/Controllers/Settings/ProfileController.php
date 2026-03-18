<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing([
            'role:id,name',
            'district:id,name',
            'department:id,name',
            'section:id,name,district_id',
            'section.district:id,name',
            'pastor:id,pastor_name,church_name,section_id',
            'pastor.section:id,name,district_id',
            'pastor.section.district:id,name',
        ]);

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'account' => $this->accountData($user),
        ]);
    }

    /**
     * Build the system account details shown on the settings profile page.
     *
     * @return array<string, string|null>
     */
    private function accountData(User $user): array
    {
        return [
            'role_name' => $user->roleName(),
            'status_label' => Str::headline($user->status),
            'approval_status_label' => $user->approval_status !== null
                ? Str::headline($user->approval_status)
                : null,
            'position_title' => $user->position_title,
            'department_name' => $user->department?->name,
            'district_name' => $user->district?->name
                ?? $user->section?->district?->name
                ?? $user->pastor?->section?->district?->name,
            'section_name' => $user->section?->name
                ?? $user->pastor?->section?->name,
            'pastor_name' => $user->pastor?->pastor_name,
            'church_name' => $user->pastor?->church_name,
            'scope_summary' => $this->scopeSummary($user),
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
        ];
    }

    private function scopeSummary(User $user): string
    {
        if ($user->isSuperAdmin()) {
            return 'Full system access across all districts and departments.';
        }

        if ($user->isAdmin()) {
            $districtName = $user->district?->name ?? 'Assigned district';
            $departmentName = $user->department?->name;

            if ($departmentName !== null) {
                return 'District-wide access for '.$districtName.' under '.$departmentName.'.';
            }

            return 'District-wide access for '.$districtName.' across all departments.';
        }

        if ($user->isManager()) {
            $sectionName = $user->section?->name ?? 'Assigned section';
            $districtName = $user->section?->district?->name ?? $user->district?->name;
            $departmentName = $user->department?->name;

            if ($departmentName !== null) {
                return 'Section-scoped access for '.$sectionName
                    .($districtName !== null ? ' in '.$districtName : '')
                    .' under '.$departmentName.'.';
            }

            return 'Section-scoped access for '.$sectionName
                .($districtName !== null ? ' in '.$districtName : '')
                .' across all departments.';
        }

        if ($user->isRegistrationStaff()) {
            return 'Operational onsite registration access across active events.';
        }

        if ($user->isOnlineRegistrant()) {
            $churchName = $user->pastor?->church_name ?? 'your assigned church';

            return 'Online registration access is limited to '.$churchName.'.';
        }

        return 'Access is limited to your assigned system role and scope.';
    }
}
