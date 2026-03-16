<?php

use App\Http\Controllers\Admin\DistrictController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\PastorController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OnlineRegistrationController;
use App\Http\Controllers\OnsiteRegistrationController;
use App\Http\Controllers\RegistrantAccessController;
use App\Http\Controllers\RegistrantApprovalController;
use App\Http\Controllers\RegistrationVerificationController;
use App\Http\Controllers\ReportsController;
use App\Models\District;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::middleware('guest')->group(function (): void {
    Route::get(config('registration.registrant_access_path'), [RegistrantAccessController::class, 'create'])
        ->name('registrant-access.create');
    Route::post(config('registration.registrant_access_path'), [RegistrantAccessController::class, 'store'])
        ->name('registrant-access.store');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('reports', ReportsController::class)
        ->middleware('can:viewReports')
        ->name('reports.index');
    Route::get('reports/churches-without-registration/export', [ReportsController::class, 'exportChurchesWithoutRegistration'])
        ->middleware('can:viewReports')
        ->name('reports.churches-without-registration.export');

    Route::prefix('registrations/online')
        ->name('registrations.online.')
        ->middleware('can:viewAnyOnline,'.Registration::class)
        ->group(function (): void {
            Route::get('/', [OnlineRegistrationController::class, 'index'])->name('index');
            Route::get('create', [OnlineRegistrationController::class, 'create'])->name('create');
            Route::get('{registration}/edit', [OnlineRegistrationController::class, 'edit'])->name('edit');
            Route::post('/', [OnlineRegistrationController::class, 'store'])->name('store');
            Route::match(['put', 'patch'], '{registration}', [OnlineRegistrationController::class, 'update'])->name('update');
            Route::patch('{registration}/cancel', [OnlineRegistrationController::class, 'cancel'])->name('cancel');
        });

    Route::prefix('registrations/onsite')
        ->name('registrations.onsite.')
        ->middleware('can:viewAnyOnsite,'.Registration::class)
        ->group(function (): void {
            Route::get('/', [OnsiteRegistrationController::class, 'index'])->name('index');
            Route::get('create', [OnsiteRegistrationController::class, 'create'])->name('create');
            Route::get('{registration}/edit', [OnsiteRegistrationController::class, 'edit'])->name('edit');
            Route::post('/', [OnsiteRegistrationController::class, 'store'])->name('store');
            Route::match(['put', 'patch'], '{registration}', [OnsiteRegistrationController::class, 'update'])->name('update');
        });

    Route::prefix('registrations/verification')
        ->name('registrations.verification.')
        ->middleware('can:viewAnyVerification,'.Registration::class)
        ->group(function (): void {
            Route::get('/', [RegistrationVerificationController::class, 'index'])->name('index');
            Route::get('{registration}/receipt', [RegistrationVerificationController::class, 'receipt'])->name('receipt');
            Route::patch('{registration}', [RegistrationVerificationController::class, 'update'])->name('update');
        });

    Route::prefix('account-requests')
        ->name('account-requests.')
        ->middleware('can:viewAnyApprovalQueue,'.User::class)
        ->group(function (): void {
            Route::get('/', [RegistrantApprovalController::class, 'index'])->name('index');
            Route::patch('{user}', [RegistrantApprovalController::class, 'update'])->name('update');
        });

    Route::prefix('admin')
        ->name('admin.')
        ->middleware('can:viewAny,'.District::class)
        ->group(function (): void {
            Route::resource('events', EventController::class)->except('show');
            Route::resource('users', UserController::class)->except('show');
            Route::resource('districts', DistrictController::class)->except('show');
            Route::resource('sections', SectionController::class)->except('show');
            Route::resource('pastors', PastorController::class)->except('show');
        });
});

require __DIR__.'/settings.php';
