<?php

namespace App\Providers;

use App\Models\Department;
use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\Section;
use App\Models\User;
use App\Policies\DepartmentPolicy;
use App\Policies\DistrictPolicy;
use App\Policies\EventFeeCategoryPolicy;
use App\Policies\EventPolicy;
use App\Policies\PastorPolicy;
use App\Policies\RegistrationPolicy;
use App\Policies\SectionPolicy;
use App\Policies\UserPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAuthorization();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    protected function configureAuthorization(): void
    {
        Gate::before(function (User $user, string $ability): ?bool {
            if (! $user->isActive()) {
                return false;
            }

            if ($user->isSuperAdmin()) {
                return true;
            }

            return null;
        });

        Gate::policy(District::class, DistrictPolicy::class);
        Gate::policy(Department::class, DepartmentPolicy::class);
        Gate::policy(Event::class, EventPolicy::class);
        Gate::policy(EventFeeCategory::class, EventFeeCategoryPolicy::class);
        Gate::policy(Pastor::class, PastorPolicy::class);
        Gate::policy(Registration::class, RegistrationPolicy::class);
        Gate::policy(Section::class, SectionPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        Gate::define('viewReports', function (User $user): bool {
            return $user->isAdmin() && $user->district_id !== null
                || $user->isSuperAdmin()
                || ($user->isManager() && $user->section_id !== null);
        });

        Gate::define('viewSectionReport', function (User $user, Section $section): bool {
            if ($user->isSuperAdmin()) {
                return true;
            }

            if ($user->isAdmin()) {
                return $user->district_id !== null
                    && $section->district_id === $user->district_id;
            }

            return $user->isManager()
                && $user->section_id !== null
                && $user->section_id === $section->getKey();
        });

        Gate::define('viewPastorReport', function (User $user, Pastor $pastor): bool {
            if ($user->isSuperAdmin()) {
                return true;
            }

            if ($user->isAdmin()) {
                return $user->district_id !== null
                    && $pastor->section?->district_id === $user->district_id;
            }

            return $user->isManager()
                && $user->managesSection($pastor->section_id);
        });
    }
}
