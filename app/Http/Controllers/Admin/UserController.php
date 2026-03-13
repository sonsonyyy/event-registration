<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('admin/users/index', [
            'users' => User::query()
                ->with([
                    'role:id,name',
                    'district:id,name',
                    'section:id,name,district_id',
                    'section.district:id,name',
                    'pastor:id,pastor_name,church_name,section_id',
                    'pastor.section:id,name,district_id',
                    'pastor.section.district:id,name',
                ])
                ->orderBy('name')
                ->get()
                ->map(fn (User $user): array => $this->userIndexData($user))
                ->values(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        Gate::authorize('create', User::class);

        return Inertia::render('admin/users/create', [
            'roles' => $this->roleOptions(),
            'districts' => $this->districtOptions(),
            'sections' => $this->sectionOptions(),
            'pastors' => $this->pastorOptions(),
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $payload = $request->userData();

        $user = User::query()->create($payload);
        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        return to_route('admin.users.index')->with('success', 'User created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user): Response
    {
        Gate::authorize('update', $user);

        $user->load([
            'role:id,name',
            'district:id,name',
            'section:id,name,district_id',
            'section.district:id,name',
            'pastor:id,pastor_name,church_name,section_id',
            'pastor.section:id,name,district_id',
            'pastor.section.district:id,name',
        ]);

        return Inertia::render('admin/users/edit', [
            'userRecord' => $this->userFormData($user),
            'roles' => $this->roleOptions(),
            'districts' => $this->districtOptions(),
            'sections' => $this->sectionOptions(),
            'pastors' => $this->pastorOptions(),
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $payload = $request->userData();

        if ($user->email !== $payload['email']) {
            $user->forceFill([
                ...$payload,
                'email_verified_at' => now(),
            ])->save();

            return to_route('admin.users.index')->with('success', 'User updated successfully.');
        }

        $user->update($payload);

        return to_route('admin.users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        Gate::authorize('delete', $user);

        if (auth()->id() === $user->getKey()) {
            return to_route('admin.users.index')->with('error', 'You cannot delete your own account.');
        }

        try {
            $user->delete();
        } catch (QueryException) {
            return to_route('admin.users.index')->with(
                'error',
                'This user cannot be deleted because it is referenced by existing records. Deactivate the account instead.',
            );
        }

        return to_route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    /**
     * Transform a user for the list page.
     *
     * @return array<string, mixed>
     */
    private function userIndexData(User $user): array
    {
        return [
            'id' => $user->getKey(),
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'role' => [
                'id' => $user->role?->getKey(),
                'name' => $user->roleName(),
            ],
            'district' => $user->district ? [
                'id' => $user->district->getKey(),
                'name' => $user->district->name,
            ] : null,
            'section' => $user->section ? [
                'id' => $user->section->getKey(),
                'name' => $user->section->name,
                'district_name' => $user->section->district?->name,
            ] : null,
            'pastor' => $user->pastor ? [
                'id' => $user->pastor->getKey(),
                'pastor_name' => $user->pastor->pastor_name,
                'church_name' => $user->pastor->church_name,
                'section_name' => $user->pastor->section?->name,
                'district_name' => $user->pastor->section?->district?->name,
            ] : null,
            'scope_summary' => $this->scopeSummary($user),
            'can_delete' => auth()->id() !== $user->getKey(),
            'is_current_user' => auth()->id() === $user->getKey(),
        ];
    }

    /**
     * Transform a user record for the form pages.
     *
     * @return array<string, mixed>
     */
    private function userFormData(User $user): array
    {
        return [
            'id' => $user->getKey(),
            'name' => $user->name,
            'email' => $user->email,
            'role_id' => $user->role_id,
            'district_id' => $user->district_id,
            'section_id' => $user->section_id,
            'pastor_id' => $user->pastor_id,
            'status' => $user->status,
            'scope_summary' => $this->scopeSummary($user),
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
        ];
    }

    /**
     * Build the supported role options.
     *
     * @return array<int, array<string, mixed>>
     */
    private function roleOptions(): array
    {
        $sortOrder = [
            Role::ADMIN,
            Role::MANAGER,
            Role::REGISTRATION_STAFF,
            Role::ONLINE_REGISTRANT,
        ];

        collect($sortOrder)->each(function (string $roleName): void {
            Role::query()->firstOrCreate([
                'name' => $roleName,
            ]);
        });

        return Role::query()
            ->get()
            ->sortBy(function (Role $role) use ($sortOrder): int {
                $position = array_search($role->name, $sortOrder, true);

                return $position === false ? PHP_INT_MAX : $position;
            })
            ->map(fn (Role $role): array => [
                'id' => $role->getKey(),
                'name' => $role->name,
            ])
            ->values()
            ->all();
    }

    /**
     * Build district options for the user form.
     *
     * @return array<int, array<string, mixed>>
     */
    private function districtOptions(): array
    {
        return District::query()
            ->orderBy('name')
            ->get()
            ->map(fn (District $district): array => [
                'id' => $district->getKey(),
                'name' => $district->name,
                'status' => $district->status,
            ])
            ->values()
            ->all();
    }

    /**
     * Build section options for the user form.
     *
     * @return array<int, array<string, mixed>>
     */
    private function sectionOptions(): array
    {
        return Section::query()
            ->with('district:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (Section $section): array => [
                'id' => $section->getKey(),
                'name' => $section->name,
                'district_id' => $section->district_id,
                'district_name' => $section->district->name,
                'status' => $section->status,
            ])
            ->values()
            ->all();
    }

    /**
     * Build pastor options for the user form.
     *
     * @return array<int, array<string, mixed>>
     */
    private function pastorOptions(): array
    {
        return Pastor::query()
            ->with('section:id,name,district_id', 'section.district:id,name')
            ->orderBy('church_name')
            ->get()
            ->map(fn (Pastor $pastor): array => [
                'id' => $pastor->getKey(),
                'pastor_name' => $pastor->pastor_name,
                'church_name' => $pastor->church_name,
                'section_id' => $pastor->section_id,
                'section_name' => $pastor->section->name,
                'district_id' => $pastor->section->district->getKey(),
                'district_name' => $pastor->section->district->name,
                'status' => $pastor->status,
            ])
            ->values()
            ->all();
    }

    /**
     * Build the common status options.
     *
     * @return array<int, array<string, string>>
     */
    private function statusOptions(): array
    {
        return [
            ['value' => 'active', 'label' => 'Active'],
            ['value' => 'inactive', 'label' => 'Inactive'],
        ];
    }

    private function scopeSummary(User $user): string
    {
        if ($user->pastor !== null) {
            return sprintf(
                '%s · %s',
                $user->pastor->church_name,
                $user->pastor->section?->name ?? 'No section',
            );
        }

        if ($user->section !== null) {
            return sprintf(
                '%s · %s',
                $user->section->name,
                $user->section->district?->name ?? 'No district',
            );
        }

        if ($user->district !== null) {
            return $user->district->name;
        }

        return $user->isAdmin() ? 'Global access' : 'No scope assigned';
    }
}
