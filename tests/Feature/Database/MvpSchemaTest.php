<?php

use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Schema;

test('mvp schema tables and key columns exist', function () {
    expect(Schema::hasTable('roles'))->toBeTrue();
    expect(Schema::hasTable('districts'))->toBeTrue();
    expect(Schema::hasTable('sections'))->toBeTrue();
    expect(Schema::hasTable('pastors'))->toBeTrue();
    expect(Schema::hasTable('events'))->toBeTrue();
    expect(Schema::hasTable('event_fee_categories'))->toBeTrue();
    expect(Schema::hasTable('registrations'))->toBeTrue();
    expect(Schema::hasTable('registration_items'))->toBeTrue();
    expect(Schema::hasColumns('users', ['role_id', 'district_id', 'section_id', 'pastor_id', 'status']))->toBeTrue();
    expect(Schema::hasColumns('registrations', [
        'event_id',
        'pastor_id',
        'encoded_by_user_id',
        'registration_mode',
        'payment_status',
        'registration_status',
        'payment_reference',
        'receipt_file_path',
        'receipt_original_name',
        'receipt_uploaded_at',
        'receipt_uploaded_by_user_id',
        'submitted_at',
        'verified_at',
        'verified_by_user_id',
    ]))->toBeTrue();
    expect(Schema::hasColumns('registration_items', [
        'registration_id',
        'fee_category_id',
        'quantity',
        'unit_amount',
        'subtotal_amount',
    ]))->toBeTrue();
});

test('role seeder creates the default application roles', function () {
    $this->seed(RoleSeeder::class);

    expect(Role::query()->pluck('name')->all())->toEqualCanonicalizing([
        Role::ADMIN,
        Role::MANAGER,
        Role::REGISTRATION_STAFF,
        Role::ONLINE_REGISTRANT,
    ]);
});

test('core mvp model relationships resolve correctly', function () {
    $role = Role::factory()->admin()->create();
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $pastor = Pastor::factory()->for($section)->create();
    $user = User::factory()
        ->for($role)
        ->for($district)
        ->for($section)
        ->for($pastor)
        ->create();
    $event = Event::factory()->create();
    $feeCategory = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular Online',
    ]);
    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($user, 'encodedByUser')
        ->for($user, 'receiptUploadedByUser')
        ->create([
            'registration_mode' => 'online',
            'payment_status' => 'for verification',
            'registration_status' => 'pending verification',
            'receipt_file_path' => 'receipts/sample.pdf',
            'receipt_original_name' => 'sample.pdf',
            'receipt_uploaded_at' => now(),
        ]);
    $item = RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => 3,
            'unit_amount' => 250,
            'subtotal_amount' => 750,
        ]);

    expect($district->sections)->toHaveCount(1);
    expect($district->sections->first()->is($section))->toBeTrue();
    expect($section->district->is($district))->toBeTrue();
    expect($section->pastors->first()->is($pastor))->toBeTrue();
    expect($pastor->section->is($section))->toBeTrue();
    expect($user->role->is($role))->toBeTrue();
    expect($user->district->is($district))->toBeTrue();
    expect($user->section->is($section))->toBeTrue();
    expect($user->pastor->is($pastor))->toBeTrue();
    expect($event->feeCategories->first()->is($feeCategory))->toBeTrue();
    expect($registration->event->is($event))->toBeTrue();
    expect($registration->pastor->is($pastor))->toBeTrue();
    expect($registration->encodedByUser->is($user))->toBeTrue();
    expect($registration->receiptUploadedByUser->is($user))->toBeTrue();
    expect($registration->items->first()->is($item))->toBeTrue();
    expect($item->registration->is($registration))->toBeTrue();
    expect($item->feeCategory->is($feeCategory))->toBeTrue();
});
