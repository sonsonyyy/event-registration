<?php

namespace App\Http\Middleware;

use App\Models\District;
use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Middleware;
use Inertia\OnceProp;
use Inertia\Support\Header;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

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

    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        Inertia::version(function () use ($request) {
            return $this->version($request);
        });

        Inertia::share($this->share($request));

        foreach ($this->shareOnce($request) as $key => $value) {
            if ($value instanceof OnceProp) {
                Inertia::share($key, $value);
            } else {
                Inertia::shareOnce($key, $value);
            }
        }

        Inertia::setRootView($this->rootView($request));

        if ($urlResolver = $this->urlResolver()) {
            Inertia::resolveUrlUsing($urlResolver);
        }

        $response = $next($request);

        $this->flashToastData($request);

        $response->headers->set('Vary', Header::INERTIA);

        if ($response->isRedirect()) {
            $this->reflash($request);
        }

        if (! $request->header(Header::INERTIA)) {
            return $response;
        }

        if ($request->method() === 'GET' && $request->header(Header::VERSION, '') !== Inertia::getVersion()) {
            $response = $this->onVersionChange($request, $response);
        }

        if ($response->isOk() && empty($response->getContent())) {
            $response = $this->onEmptyResponse($request, $response);
        }

        if ($response->getStatusCode() === 302 && in_array($request->method(), ['PUT', 'PATCH', 'DELETE'])) {
            $response->setStatusCode(303);
        }

        return $response;
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
            'appVersion' => config('app.version'),
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
                    'viewSystemAdminMenu' => $user?->isSuperAdmin() ?? false,
                    'manageOnlineRegistrations' => ($user?->isOnlineRegistrant() ?? false)
                        && ($user?->can('viewAnyOnline', Registration::class) ?? false),
                    'manageOnsiteRegistrations' => $user?->can('viewAnyOnsite', Registration::class) ?? false,
                    'viewReports' => $user?->can('viewReports') ?? false,
                    'reviewOnlineRegistrations' => $user?->can('viewAnyVerification', Registration::class) ?? false,
                    'manageUsers' => $user?->can('viewAny', User::class) ?? false,
                    'reviewRegistrantAccounts' => $user?->can('viewAnyApprovalQueue', User::class) ?? false,
                ],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    private function flashToastData(Request $request): void
    {
        if (! $request->hasSession() || Inertia::getFlashed($request) !== []) {
            return;
        }

        $toasts = [];
        $success = $request->session()->get('success');
        $error = $request->session()->get('error');
        $status = $request->session()->get('status');

        if (is_string($success) && trim($success) !== '') {
            $toasts[] = [
                'key' => (string) Str::uuid(),
                'variant' => 'success',
                'title' => $success,
            ];
        }

        if (is_string($error) && trim($error) !== '') {
            $toasts[] = [
                'key' => (string) Str::uuid(),
                'variant' => 'error',
                'title' => $error,
            ];
        }

        if (
            is_string($status)
            && trim($status) !== ''
            && $status !== 'registrant-access-submitted'
        ) {
            $toasts[] = [
                'key' => (string) Str::uuid(),
                'variant' => 'success',
                'title' => $status === 'verification-link-sent'
                    ? 'Verification email sent'
                    : $status,
            ];
        }

        if ($toasts !== []) {
            Inertia::flash('toasts', $toasts);
        }
    }
}
