<?php

namespace App\Http\Middleware;

use App\Models\District;
use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => null,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'role_name' => $user->roleName(),
                    'status' => $user->status,
                    'approval_status' => $user->approval_status,
                ] : null,
                'can' => [
                    'manageEvents' => $user?->can('create', Event::class) ?? false,
                    'manageMasterData' => $user?->can('viewAny', District::class) ?? false,
                    'manageOnlineRegistrations' => ($user?->isOnlineRegistrant() ?? false)
                        && ($user?->can('viewAnyOnline', Registration::class) ?? false),
                    'manageOnsiteRegistrations' => $user?->can('viewAnyOnsite', Registration::class) ?? false,
                    'viewReports' => $user?->can('viewReports') ?? false,
                    'reviewOnlineRegistrations' => $user?->can('viewAnyVerification', Registration::class) ?? false,
                    'manageUsers' => $user?->can('viewAny', User::class) ?? false,
                    'reviewRegistrantAccounts' => $user?->can('viewAnyApprovalQueue', User::class) ?? false,
                ],
            ],
            'flash' => [
                'success' => fn (): ?string => $request->session()->get('success'),
                'error' => fn (): ?string => $request->session()->get('error'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
