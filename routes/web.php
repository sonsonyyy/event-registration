<?php

use App\Http\Controllers\Admin\DistrictController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\PastorController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\OnsiteRegistrationController;
use App\Models\District;
use App\Models\Registration;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('registrations/onsite')
        ->name('registrations.onsite.')
        ->middleware('can:viewAnyOnsite,'.Registration::class)
        ->group(function (): void {
            Route::get('/', [OnsiteRegistrationController::class, 'index'])->name('index');
            Route::get('create', [OnsiteRegistrationController::class, 'create'])->name('create');
            Route::post('/', [OnsiteRegistrationController::class, 'store'])->name('store');
        });

    Route::prefix('admin')
        ->name('admin.')
        ->middleware('can:viewAny,'.District::class)
        ->group(function (): void {
            Route::resource('events', EventController::class)->except('show');
            Route::resource('districts', DistrictController::class)->except('show');
            Route::resource('sections', SectionController::class)->except('show');
            Route::resource('pastors', PastorController::class)->except('show');
        });
});

require __DIR__.'/settings.php';
