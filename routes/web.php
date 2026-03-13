<?php

use App\Http\Controllers\Admin\DistrictController;
use App\Http\Controllers\Admin\PastorController;
use App\Http\Controllers\Admin\SectionController;
use App\Models\District;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('admin')
        ->name('admin.')
        ->middleware('can:viewAny,'.District::class)
        ->group(function (): void {
            Route::resource('districts', DistrictController::class)->except('show');
            Route::resource('sections', SectionController::class)->except('show');
            Route::resource('pastors', PastorController::class)->except('show');
        });
});

require __DIR__.'/settings.php';
