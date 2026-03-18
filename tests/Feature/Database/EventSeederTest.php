<?php

use App\Models\Department;
use App\Models\Event;
use Database\Seeders\DatabaseSeeder;

test('database seeder creates the default open event with fee categories', function () {
    $this->seed(DatabaseSeeder::class);

    $event = Event::query()
        ->with(['feeCategories', 'department'])
        ->where('name', 'CLD Youth Conference 2026')
        ->firstOrFail();

    $feeCategories = $event->feeCategories->keyBy('category_name');

    expect($event->name)->toBe('CLD Youth Conference 2026')
        ->and($event->venue)->toBe('SMX Convention Center, Clark')
        ->and($event->description)->toBe('CLD Youth Ministries: ONE. For Souls. For Impact')
        ->and($event->date_from->toDateString())->toBe('2026-05-05')
        ->and($event->date_to->toDateString())->toBe('2026-05-06')
        ->and($event->registration_open_at->toDateTimeString())->toBe('2026-03-15 00:00:00')
        ->and($event->registration_close_at->toDateTimeString())->toBe('2026-04-12 23:59:59')
        ->and($event->status)->toBe(Event::STATUS_OPEN)
        ->and($event->scope_type)->toBe(Event::SCOPE_DISTRICT)
        ->and($event->section_id)->toBeNull()
        ->and($event->department?->name)->toBe('Youth Ministries')
        ->and($event->department_id)->toBe(Department::query()->where('name', 'Youth Ministries')->value('id'))
        ->and($event->total_capacity)->toBe(1200)
        ->and($event->feeCategories)->toHaveCount(3)
        ->and($feeCategories->keys()->sort()->values()->all())->toBe([
            'One-day Pass',
            'Regular (Online)',
            'Regular (Onsite)',
        ])
        ->and($feeCategories['Regular (Online)']->amount)->toBe('800.00')
        ->and($feeCategories['Regular (Online)']->status)->toBe('active')
        ->and($feeCategories['Regular (Online)']->slot_limit)->toBeNull()
        ->and($feeCategories['One-day Pass']->amount)->toBe('600.00')
        ->and($feeCategories['One-day Pass']->status)->toBe('inactive')
        ->and($feeCategories['One-day Pass']->slot_limit)->toBeNull()
        ->and($feeCategories['Regular (Onsite)']->amount)->toBe('950.00')
        ->and($feeCategories['Regular (Onsite)']->status)->toBe('inactive')
        ->and($feeCategories['Regular (Onsite)']->slot_limit)->toBeNull();
});
