<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRegistrantAccessRequest;
use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegistrantAccessController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/registrant-access', [
            'districts' => $this->districtOptions(),
            'sections' => $this->sectionOptions(),
            'pastors' => $this->pastorOptions(),
        ]);
    }

    public function store(StoreRegistrantAccessRequest $request): RedirectResponse
    {
        $roleId = Role::query()->firstOrCreate([
            'name' => Role::ONLINE_REGISTRANT,
        ])->id;

        $user = User::query()->create([
            ...$request->requestedUserData(),
            'role_id' => $roleId,
            'status' => User::STATUS_ACTIVE,
            'approval_status' => User::APPROVAL_PENDING,
            'account_source' => User::ACCOUNT_SOURCE_SELF_SERVICE,
        ]);

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        return to_route('login')->with(
            'status',
            'Registrant account request submitted. You can sign in now, but online registration stays locked until an admin or manager approves your church account.',
        );
    }

    /**
     * Build the district options that still have eligible church accounts.
     *
     * @return array<int, array<string, mixed>>
     */
    private function districtOptions(): array
    {
        return District::query()
            ->where('status', 'active')
            ->whereHas('sections.pastors', function (Builder $query): void {
                $this->eligiblePastorConstraint($query);
            })
            ->orderBy('name')
            ->get()
            ->map(fn (District $district): array => [
                'id' => $district->getKey(),
                'name' => $district->name,
            ])
            ->values()
            ->all();
    }

    /**
     * Build the section options that still have eligible church accounts.
     *
     * @return array<int, array<string, mixed>>
     */
    private function sectionOptions(): array
    {
        return Section::query()
            ->where('status', 'active')
            ->whereHas('pastors', function (Builder $query): void {
                $this->eligiblePastorConstraint($query);
            })
            ->with('district:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (Section $section): array => [
                'id' => $section->getKey(),
                'name' => $section->name,
                'district_id' => $section->district_id,
                'district_name' => $section->district?->name,
            ])
            ->values()
            ->all();
    }

    /**
     * Build the available pastor and church options for self-service signup.
     *
     * @return array<int, array<string, mixed>>
     */
    private function pastorOptions(): array
    {
        return Pastor::query()
            ->where('status', 'active')
            ->whereHas('section', function (Builder $query): void {
                $query->where('status', 'active')
                    ->whereHas('district', function (Builder $districtQuery): void {
                        $districtQuery->where('status', 'active');
                    });
            })
            ->with('section.district')
            ->whereDoesntHave('assignedUsers', function (Builder $query): void {
                $query->where('status', User::STATUS_ACTIVE)
                    ->whereIn('approval_status', [
                        User::APPROVAL_PENDING,
                        User::APPROVAL_APPROVED,
                    ])
                    ->whereHas('role', function (Builder $roleQuery): void {
                        $roleQuery->where('name', Role::ONLINE_REGISTRANT);
                    });
            })
            ->orderBy('church_name')
            ->orderBy('pastor_name')
            ->get()
            ->map(fn (Pastor $pastor): array => [
                'id' => $pastor->getKey(),
                'pastor_name' => $pastor->pastor_name,
                'church_name' => $pastor->church_name,
                'section_id' => $pastor->section_id,
                'section_name' => $pastor->section?->name,
                'district_id' => $pastor->section?->district_id,
                'district_name' => $pastor->section?->district?->name,
            ])
            ->values()
            ->all();
    }

    private function eligiblePastorConstraint(Builder $query): void
    {
        $query
            ->where('status', 'active')
            ->whereDoesntHave('assignedUsers', function (Builder $userQuery): void {
                $userQuery->where('status', User::STATUS_ACTIVE)
                    ->whereIn('approval_status', [
                        User::APPROVAL_PENDING,
                        User::APPROVAL_APPROVED,
                    ])
                    ->whereHas('role', function (Builder $roleQuery): void {
                        $roleQuery->where('name', Role::ONLINE_REGISTRANT);
                    });
            });
    }
}
