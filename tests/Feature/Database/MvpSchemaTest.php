<?php

use App\Models\Department;
use App\Models\District;
use App\Models\Event;
use App\Models\EventCheckIn;
use App\Models\EventCheckInItem;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationHistory;
use App\Models\RegistrationItem;
use App\Models\RegistrationReview;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Schema;

test('mvp schema tables and key columns exist', function () {
    expect(Schema::hasTable('roles'))->toBeTrue();
    expect(Schema::hasTable('districts'))->toBeTrue();
    expect(Schema::hasTable('sections'))->toBeTrue();
    expect(Schema::hasTable('departments'))->toBeTrue();
    expect(Schema::hasTable('pastors'))->toBeTrue();
    expect(Schema::hasTable('events'))->toBeTrue();
    expect(Schema::hasTable('event_fee_categories'))->toBeTrue();
    expect(Schema::hasTable('registrations'))->toBeTrue();
    expect(Schema::hasTable('registration_items'))->toBeTrue();
    expect(Schema::hasTable('registration_histories'))->toBeTrue();
    expect(Schema::hasTable('registration_reviews'))->toBeTrue();
    expect(Schema::hasTable('event_check_ins'))->toBeTrue();
    expect(Schema::hasTable('event_check_in_items'))->toBeTrue();
    expect(Schema::hasColumns('districts', ['deleted_at']))->toBeTrue();
    expect(Schema::hasColumns('sections', ['deleted_at']))->toBeTrue();
    expect(Schema::hasColumns('departments', ['deleted_at']))->toBeTrue();
    expect(Schema::hasColumns('pastors', ['deleted_at']))->toBeTrue();
    expect(Schema::hasColumns('events', ['deleted_at']))->toBeTrue();
    expect(Schema::hasColumns('event_fee_categories', ['deleted_at']))->toBeTrue();
    expect(Schema::hasColumns('users', ['deleted_at']))->toBeTrue();
    expect(Schema::hasColumns('registrations', ['deleted_at']))->toBeTrue();
    expect(Schema::hasColumns('users', [
        'role_id',
        'district_id',
        'section_id',
        'department_id',
        'pastor_id',
        'position_title',
        'status',
    ]))->toBeTrue();
    expect(Schema::hasColumns('events', [
        'scope_type',
        'district_id',
        'section_id',
        'department_id',
    ]))->toBeTrue();
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
    expect(Schema::hasColumns('registration_reviews', [
        'registration_id',
        'reviewer_user_id',
        'decision',
        'reason',
        'notes',
        'decided_at',
    ]))->toBeTrue();
    expect(Schema::hasColumns('registration_histories', [
        'registration_id',
        'altered_by_user_id',
        'snapshot',
        'altered_at',
    ]))->toBeTrue();
    expect(Schema::hasColumns('event_check_ins', [
        'event_id',
        'pastor_id',
        'checked_in_by_user_id',
        'representative_name',
        'total_claimed_quantity',
        'remarks',
        'checked_in_at',
    ]))->toBeTrue();
    expect(Schema::hasColumns('event_check_in_items', [
        'event_check_in_id',
        'fee_category_id',
        'quantity_claimed',
        'remarks',
    ]))->toBeTrue();
});

test('role seeder creates the default application roles', function () {
    $this->seed(RoleSeeder::class);

    expect(Role::query()->pluck('name')->all())->toEqualCanonicalizing([
        Role::SUPER_ADMIN,
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
    $department = Department::factory()->create();
    $pastor = Pastor::factory()->for($section)->create();
    $user = User::factory()
        ->for($role)
        ->for($district)
        ->for($section)
        ->for($department)
        ->for($pastor)
        ->create();
    $event = Event::factory()->create([
        'scope_type' => Event::SCOPE_SECTION,
        'district_id' => $district->id,
        'section_id' => $section->id,
        'department_id' => $department->id,
    ]);
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
    $review = RegistrationReview::factory()
        ->for($registration)
        ->for($user, 'reviewer')
        ->create([
            'decision' => Registration::STATUS_NEEDS_CORRECTION,
            'reason' => 'Receipt image is incomplete.',
        ]);
    $history = RegistrationHistory::factory()
        ->for($registration)
        ->for($user, 'alteredByUser')
        ->create();
    $eventCheckIn = EventCheckIn::factory()
        ->for($event)
        ->for($pastor)
        ->for($user, 'checkedInByUser')
        ->create([
            'representative_name' => 'Brother Joel',
            'total_claimed_quantity' => 2,
        ]);
    $eventCheckInItem = EventCheckInItem::factory()
        ->for($eventCheckIn)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity_claimed' => 2,
        ]);

    expect($district->sections)->toHaveCount(1);
    expect($district->sections->first()->is($section))->toBeTrue();
    expect($section->district->is($district))->toBeTrue();
    expect($section->pastors->first()->is($pastor))->toBeTrue();
    expect($pastor->section->is($section))->toBeTrue();
    expect($user->role->is($role))->toBeTrue();
    expect($user->district->is($district))->toBeTrue();
    expect($user->section->is($section))->toBeTrue();
    expect($user->department->is($department))->toBeTrue();
    expect($user->pastor->is($pastor))->toBeTrue();
    expect($event->district->is($district))->toBeTrue();
    expect($event->section->is($section))->toBeTrue();
    expect($event->department->is($department))->toBeTrue();
    expect($event->feeCategories->first()->is($feeCategory))->toBeTrue();
    expect($event->eventCheckIns->first()->is($eventCheckIn))->toBeTrue();
    expect($registration->event->is($event))->toBeTrue();
    expect($registration->pastor->is($pastor))->toBeTrue();
    expect($registration->encodedByUser->is($user))->toBeTrue();
    expect($registration->receiptUploadedByUser->is($user))->toBeTrue();
    expect($registration->items->first()->is($item))->toBeTrue();
    expect($registration->reviews->first()->is($review))->toBeTrue();
    expect($registration->histories->first()->is($history))->toBeTrue();
    expect($registration->latestReview->is($review))->toBeTrue();
    expect($item->registration->is($registration))->toBeTrue();
    expect($item->feeCategory->is($feeCategory))->toBeTrue();
    expect($review->registration->is($registration))->toBeTrue();
    expect($review->reviewer->is($user))->toBeTrue();
    expect($history->registration->is($registration))->toBeTrue();
    expect($history->alteredByUser->is($user))->toBeTrue();
    expect($pastor->eventCheckIns->first()->is($eventCheckIn))->toBeTrue();
    expect($user->processedEventCheckIns->first()->is($eventCheckIn))->toBeTrue();
    expect($feeCategory->eventCheckInItems->first()->is($eventCheckInItem))->toBeTrue();
    expect($eventCheckIn->event->is($event))->toBeTrue();
    expect($eventCheckIn->pastor->is($pastor))->toBeTrue();
    expect($eventCheckIn->checkedInByUser->is($user))->toBeTrue();
    expect($eventCheckIn->items->first()->is($eventCheckInItem))->toBeTrue();
    expect($eventCheckInItem->eventCheckIn->is($eventCheckIn))->toBeTrue();
    expect($eventCheckInItem->feeCategory->is($feeCategory))->toBeTrue();
});
