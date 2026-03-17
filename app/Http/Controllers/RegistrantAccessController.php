<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRegistrantAccessRequest;
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
            'registrant-access-submitted',
        );
    }

    /**
     * Build the section options that still have eligible church accounts.
     *
     * @return array<int, array<string, mixed>>
     */
    private function sectionOptions(): array
    {
        $eligibleSectionIds = $this->eligiblePastorQuery()
            ->select('section_id')
            ->distinct()
            ->pluck('section_id');

        return Section::query()
            ->where('status', 'active')
            ->whereIn('id', $eligibleSectionIds)
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
        return $this->eligiblePastorQuery()
            ->with('section.district')
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

    private function eligiblePastorQuery(): Builder
    {
        return Pastor::query()
            ->where('status', 'active')
            ->whereHas('section', function (Builder $query): void {
                $query->where('status', 'active')
                    ->whereHas('district', function (Builder $districtQuery): void {
                        $districtQuery->where('status', 'active');
                    });
            })
            ->whereHas(
                'assignedUsers',
                function (Builder $query): void {
                    $this->registrantAccountConstraint($query);
                },
                '<',
                User::MAX_REGISTRANT_ACCOUNTS_PER_PASTOR,
            );
    }

    private function registrantAccountConstraint(Builder $query): void
    {
        $query->where('status', User::STATUS_ACTIVE)
            ->whereIn('approval_status', User::REGISTRANT_OCCUPYING_APPROVAL_STATUSES)
            ->whereHas('role', function (Builder $roleQuery): void {
                $roleQuery->where('name', Role::ONLINE_REGISTRANT);
            });
    }
}
