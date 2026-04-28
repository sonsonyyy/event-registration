<?php

use App\Models\Department;
use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Section;
use App\Models\User;
use App\Support\NotificationRecipientResolver;

test('resolver returns account request reviewers for the matching district admins, section managers, and super admins', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $otherSection = Section::factory()->for($district)->create();
    $otherDistrict = District::factory()->create();
    $otherDistrictSection = Section::factory()->for($otherDistrict)->create();
    $pastor = Pastor::factory()->for($section)->create([
        'church_name' => 'Grace Community Church',
    ]);

    $accountRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $district->id,
            'section_id' => $section->id,
            'pastor_id' => $pastor->id,
        ]);

    $eligibleSuperAdmin = User::factory()->superAdmin()->create();
    $eligibleAdmin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $eligibleDepartmentAdmin = User::factory()->admin()->create([
        'district_id' => $district->id,
        'department_id' => Department::factory()->create()->id,
    ]);
    $eligibleManager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);
    $eligibleDepartmentManager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'department_id' => Department::factory()->create()->id,
    ]);

    User::factory()->admin()->create([
        'district_id' => $otherDistrict->id,
    ]);
    User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $otherSection->id,
    ]);
    User::factory()->admin()->inactive()->create([
        'district_id' => $district->id,
    ]);
    User::factory()->manager()->create([
        'district_id' => $otherDistrict->id,
        'section_id' => $otherDistrictSection->id,
    ]);

    $reviewerIds = app(NotificationRecipientResolver::class)
        ->reviewersForRegistrantAccessRequest($accountRequest)
        ->pluck('id')
        ->sort()
        ->values()
        ->all();

    expect($reviewerIds)->toBe([
        $eligibleSuperAdmin->id,
        $eligibleAdmin->id,
        $eligibleDepartmentAdmin->id,
        $eligibleManager->id,
        $eligibleDepartmentManager->id,
    ]);
});

test('resolver returns verification reviewers for district departmental registrations', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $department = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $otherDepartment = Department::factory()->create([
        'name' => 'Ladies Ministries',
    ]);
    $pastor = Pastor::factory()->for($section)->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $pastor->id,
    ]);
    $event = Event::factory()->create([
        'scope_type' => Event::SCOPE_DISTRICT,
        'district_id' => $district->id,
        'department_id' => $department->id,
        'status' => Event::STATUS_OPEN,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(5),
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create();
    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create();

    $eligibleSuperAdmin = User::factory()->superAdmin()->create();
    $eligibleDepartmentAdmin = User::factory()->admin()->create([
        'district_id' => $district->id,
        'department_id' => $department->id,
    ]);
    $eligibleDepartmentManager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'department_id' => $department->id,
    ]);

    User::factory()->admin()->create([
        'district_id' => $district->id,
        'department_id' => $otherDepartment->id,
    ]);
    User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);
    User::factory()->admin()->inactive()->create([
        'district_id' => $district->id,
    ]);

    $reviewerIds = app(NotificationRecipientResolver::class)
        ->reviewersForRegistration($registration)
        ->pluck('id')
        ->sort()
        ->values()
        ->all();

    expect($reviewerIds)->toBe([
        $eligibleSuperAdmin->id,
        $eligibleDepartmentAdmin->id,
        $eligibleDepartmentManager->id,
    ]);
});

test('resolver returns verification reviewers for general sectional registrations', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $otherSection = Section::factory()->for($district)->create();
    $pastor = Pastor::factory()->for($section)->create();
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $pastor->id,
    ]);
    $event = Event::factory()->create([
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $section->id,
        'department_id' => null,
        'status' => Event::STATUS_OPEN,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(5),
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create();
    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create();

    $eligibleSuperAdmin = User::factory()->superAdmin()->create();
    $eligibleManager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);

    User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'department_id' => Department::factory()->create()->id,
    ]);
    User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $otherSection->id,
    ]);
    User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);

    $reviewerIds = app(NotificationRecipientResolver::class)
        ->reviewersForRegistration($registration)
        ->pluck('id')
        ->sort()
        ->values()
        ->all();

    expect($reviewerIds)->toBe([
        $eligibleSuperAdmin->id,
        $eligibleManager->id,
    ]);
});

test('resolver returns the affected registrant recipients for account requests and registrations', function () {
    $pastor = Pastor::factory()->create();
    $registrant = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $pastor->section->district_id,
            'section_id' => $pastor->section_id,
            'pastor_id' => $pastor->id,
        ]);
    $event = Event::factory()->create([
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $pastor->section_id,
        'status' => Event::STATUS_OPEN,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(5),
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create();
    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create();

    $resolver = app(NotificationRecipientResolver::class);

    expect($resolver->registrantForRegistrantAccessRequest($registrant)?->is($registrant))->toBeTrue()
        ->and($resolver->registrantForRegistration($registration)?->is($registrant))->toBeTrue();
});
