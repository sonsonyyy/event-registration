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
use App\Http\Controllers\RegistrationVerificationController;
use App\Models\District;
use App\Models\Registration;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::prefix('registrations/online')
        ->name('registrations.online.')
        ->middleware('can:viewAnyOnline,'.Registration::class)
        ->group(function (): void {
            Route::get('/', [OnlineRegistrationController::class, 'index'])->name('index');
            Route::get('create', [OnlineRegistrationController::class, 'create'])->name('create');
            Route::post('/', [OnlineRegistrationController::class, 'store'])->name('store');
        });

    Route::prefix('registrations/onsite')
        ->name('registrations.onsite.')
        ->middleware('can:viewAnyOnsite,'.Registration::class)
        ->group(function (): void {
            Route::get('/', [OnsiteRegistrationController::class, 'index'])->name('index');
            Route::get('create', [OnsiteRegistrationController::class, 'create'])->name('create');
            Route::post('/', [OnsiteRegistrationController::class, 'store'])->name('store');
        });

    Route::prefix('registrations/verification')
        ->name('registrations.verification.')
        ->middleware('can:viewAnyVerification,'.Registration::class)
        ->group(function (): void {
            Route::get('/', [RegistrationVerificationController::class, 'index'])->name('index');
            Route::get('{registration}/receipt', [RegistrationVerificationController::class, 'receipt'])->name('receipt');
            Route::patch('{registration}', [RegistrationVerificationController::class, 'update'])->name('update');
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
