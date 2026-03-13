<?php

use App\Models\Event;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Carbon;

test('database seeder creates the default open event with fee categories', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-13 09:30:00'));

    $this->seed(DatabaseSeeder::class);

    $event = Event::query()
        ->with('feeCategories')
        ->where('name', 'CLD Youth Conference 2026')
        ->firstOrFail();

    $feeCategories = $event->feeCategories->keyBy('category_name');

    expect($event->name)->toBe('CLD Youth Conference 2026')
        ->and($event->venue)->toBe('SMX Clark, Pampanga')
        ->and($event->description)->toBe('Central Luzon District Youth Ministries Conference 2026')
        ->and($event->date_from->toDateString())->toBe('2026-05-05')
        ->and($event->date_to->toDateString())->toBe('2026-05-06')
        ->and($event->registration_open_at->toDateTimeString())->toBe('2026-03-13 00:00:00')
        ->and($event->registration_close_at->toDateTimeString())->toBe('2026-04-13 23:59:59')
        ->and($event->status)->toBe(Event::STATUS_OPEN)
        ->and($event->total_capacity)->toBe(2000)
        ->and($event->feeCategories)->toHaveCount(3)
        ->and($feeCategories->keys()->sort()->values()->all())->toBe([
            'One-day Pass',
            'Onsite',
            'Regular (Online)',
        ])
        ->and($feeCategories['Regular (Online)']->amount)->toBe('800.00')
        ->and($feeCategories['Regular (Online)']->status)->toBe('active')
        ->and($feeCategories['Regular (Online)']->slot_limit)->toBeNull()
        ->and($feeCategories['Onsite']->amount)->toBe('950.00')
        ->and($feeCategories['Onsite']->status)->toBe('active')
        ->and($feeCategories['Onsite']->slot_limit)->toBeNull()
        ->and($feeCategories['One-day Pass']->amount)->toBe('600.00')
        ->and($feeCategories['One-day Pass']->status)->toBe('active')
        ->and($feeCategories['One-day Pass']->slot_limit)->toBeNull();

    Carbon::setTestNow();
});
