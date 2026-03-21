<?php

use App\Models\Department;
use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

test('admins can perform all protected actions', function () {
    $context = authorizationContext();
    $admin = User::factory()->admin()->create([
        'district_id' => $context['district']->id,
    ]);

    $gate = Gate::forUser($admin);

    expect($gate->allows('create', Event::class))->toBeTrue();
    expect($gate->allows('update', $context['event']))->toBeTrue();
    expect($gate->allows('delete', $context['pastorOutsideSection']))->toBeTrue();
    expect($gate->allows('create', User::class))->toBeTrue();
    expect($gate->allows('verifyReceipt', $context['districtOnlineRegistration']))->toBeTrue();
    expect($gate->allows('viewAnyVerification', Registration::class))->toBeTrue();
    expect($gate->allows('viewAnyApprovalQueue', User::class))->toBeFalse();
    expect($gate->allows('viewReports'))->toBeTrue();
    expect($gate->allows('viewSectionReport', $context['section']))->toBeTrue();
    expect($gate->allows('viewPastorReport', $context['pastorOutsideSection']))->toBeTrue();
});

test('super admins can perform all protected actions', function () {
    $context = authorizationContext();
    $superAdmin = User::factory()->superAdmin()->create();

    $gate = Gate::forUser($superAdmin);

    expect($gate->allows('create', Event::class))->toBeTrue();
    expect($gate->allows('update', $context['event']))->toBeTrue();
    expect($gate->allows('delete', $context['pastorOutsideSection']))->toBeTrue();
    expect($gate->allows('create', User::class))->toBeTrue();
    expect($gate->allows('verifyReceipt', $context['districtOnlineRegistration']))->toBeTrue();
    expect($gate->allows('viewAnyVerification', Registration::class))->toBeTrue();
    expect($gate->allows('viewAnyApprovalQueue', User::class))->toBeTrue();
    expect($gate->allows('reviewRegistrantRequest', $context['pendingRegistrantRequest']))->toBeTrue();
    expect($gate->allows('viewReports'))->toBeTrue();
    expect($gate->allows('viewSectionReport', $context['section']))->toBeTrue();
    expect($gate->allows('viewPastorReport', $context['pastorOutsideSection']))->toBeTrue();
});

test('managers are limited to their assigned section', function () {
    $context = authorizationContext();
    $manager = User::factory()->manager()->create([
        'district_id' => $context['district']->id,
        'section_id' => $context['section']->id,
    ]);

    $gate = Gate::forUser($manager);

    expect($gate->allows('viewAny', Section::class))->toBeTrue();
    expect($gate->allows('view', $context['section']))->toBeTrue();
    expect($gate->allows('view', $context['otherSection']))->toBeFalse();
    expect($gate->allows('view', $context['pastorInSection']))->toBeTrue();
    expect($gate->allows('view', $context['pastorOutsideSection']))->toBeFalse();
    expect($gate->allows('createOnsite', [Registration::class, $context['pastorInSection']]))->toBeTrue();
    expect($gate->allows('createOnsite', [Registration::class, $context['pastorOutsideSection']]))->toBeFalse();
    expect($gate->allows('update', $context['onlineRegistrationInSection']))->toBeFalse();
    expect($gate->allows('update', $context['onlineRegistrationOutsideSection']))->toBeFalse();
    expect($gate->allows('update', $context['sectionVerificationRegistration']))->toBeFalse();
    expect($gate->allows('verifyReceipt', $context['onlineRegistrationInSection']))->toBeTrue();
    expect($gate->allows('verifyReceipt', $context['sectionVerificationRegistration']))->toBeTrue();
    expect($gate->allows('verifyReceipt', $context['outsideSectionVerificationRegistration']))->toBeFalse();
    expect($gate->allows('verifyReceipt', $context['districtOnlineRegistration']))->toBeFalse();
    expect($gate->allows('viewAnyVerification', Registration::class))->toBeTrue();
    expect($gate->allows('create', Event::class))->toBeTrue();
    expect($gate->allows('update', $context['pastorInSection']))->toBeFalse();
    expect($gate->allows('delete', $context['section']))->toBeFalse();
    expect($gate->allows('viewReports'))->toBeTrue();
    expect($gate->allows('viewSectionReport', $context['section']))->toBeTrue();
    expect($gate->allows('viewSectionReport', $context['otherSection']))->toBeFalse();
    expect($gate->allows('viewPastorReport', $context['pastorInSection']))->toBeTrue();
    expect($gate->allows('viewPastorReport', $context['pastorOutsideSection']))->toBeFalse();
});

test('registration staff can encode onsite registrations without master data access', function () {
    $context = authorizationContext();
    $staff = User::factory()->registrationStaff()->create([
        'district_id' => $context['district']->id,
    ]);
    $otherStaff = User::factory()->registrationStaff()->create([
        'district_id' => $context['district']->id,
    ]);
    $ownOnsiteRegistration = Registration::factory()
        ->for($context['event'])
        ->for($context['pastorOutsideSection'])
        ->for($staff, 'encodedByUser')
        ->create([
            'registration_mode' => 'onsite',
        ]);
    $otherOnsiteRegistration = Registration::factory()
        ->for($context['event'])
        ->for($context['pastorInSection'])
        ->for($otherStaff, 'encodedByUser')
        ->create([
            'registration_mode' => 'onsite',
        ]);

    $gate = Gate::forUser($staff);

    expect($gate->allows('viewAny', Event::class))->toBeFalse();
    expect($gate->allows('viewAny', EventFeeCategory::class))->toBeTrue();
    expect($gate->allows('viewAny', Pastor::class))->toBeTrue();
    expect($gate->allows('view', $context['pastorInSection']))->toBeTrue();
    expect($gate->allows('view', $context['pastorOutsideSection']))->toBeTrue();
    expect($gate->allows('createOnsite', [Registration::class, $context['pastorInSection']]))->toBeTrue();
    expect($gate->allows('viewAnyOnline', Registration::class))->toBeFalse();
    expect($gate->allows('viewAnyVerification', Registration::class))->toBeFalse();
    expect($gate->allows('createOnline', [Registration::class, $context['pastorInSection']]))->toBeFalse();
    expect($gate->allows('view', $ownOnsiteRegistration))->toBeTrue();
    expect($gate->allows('view', $otherOnsiteRegistration))->toBeFalse();
    expect($gate->allows('update', $ownOnsiteRegistration))->toBeTrue();
    expect($gate->allows('update', $otherOnsiteRegistration))->toBeFalse();
    expect($gate->allows('viewReports'))->toBeFalse();
    expect($gate->allows('create', Event::class))->toBeFalse();
    expect($gate->allows('update', $context['pastorInSection']))->toBeFalse();
    expect($gate->allows('create', User::class))->toBeFalse();
});

test('registration staff without an assigned district cannot post onsite registrations', function () {
    $context = authorizationContext();
    $staff = User::factory()->registrationStaff()->create();

    $gate = Gate::forUser($staff);

    expect($gate->allows('viewAnyOnsite', Registration::class))->toBeFalse();
    expect($gate->allows('createOnsite', [Registration::class, $context['pastorInSection']]))->toBeFalse();
});

test('department-scoped reviewers are limited to matching departments during verification', function () {
    $context = authorizationContext();
    $departmentAdmin = User::factory()->admin()->create([
        'district_id' => $context['district']->id,
        'department_id' => $context['youthDepartment']->id,
    ]);
    $departmentManager = User::factory()->manager()->create([
        'district_id' => $context['district']->id,
        'section_id' => $context['section']->id,
        'department_id' => $context['youthDepartment']->id,
    ]);

    $adminGate = Gate::forUser($departmentAdmin);
    $managerGate = Gate::forUser($departmentManager);

    expect($adminGate->allows('verifyReceipt', $context['departmentDistrictRegistration']))->toBeTrue();
    expect($adminGate->allows('verifyReceipt', $context['otherDepartmentDistrictRegistration']))->toBeFalse();
    expect($adminGate->allows('verifyReceipt', $context['sectionVerificationRegistration']))->toBeFalse();

    expect($managerGate->allows('verifyReceipt', $context['departmentDistrictRegistration']))->toBeTrue();
    expect($managerGate->allows('verifyReceipt', $context['departmentSectionVerificationRegistration']))->toBeTrue();
    expect($managerGate->allows('verifyReceipt', $context['otherDepartmentSectionVerificationRegistration']))->toBeFalse();
    expect($managerGate->allows('verifyReceipt', $context['districtOnlineRegistration']))->toBeFalse();
});

test('general no-department reviewers only match general no-department events', function () {
    $context = authorizationContext();
    $generalAdmin = User::factory()->admin()->create([
        'district_id' => $context['district']->id,
    ]);
    $generalManager = User::factory()->manager()->create([
        'district_id' => $context['district']->id,
        'section_id' => $context['section']->id,
    ]);

    $adminGate = Gate::forUser($generalAdmin);
    $managerGate = Gate::forUser($generalManager);

    expect($adminGate->allows('verifyReceipt', $context['districtOnlineRegistration']))->toBeTrue();
    expect($adminGate->allows('verifyReceipt', $context['departmentDistrictRegistration']))->toBeFalse();
    expect($managerGate->allows('verifyReceipt', $context['onlineRegistrationInSection']))->toBeTrue();
    expect($managerGate->allows('verifyReceipt', $context['departmentDistrictRegistration']))->toBeFalse();
});

test('department-scoped managers are limited to onsite registration events in their section and department', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $otherSection = Section::factory()->for($district)->create();
    $youthDepartment = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $ladiesDepartment = Department::factory()->create([
        'name' => 'Ladies Ministries',
    ]);
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'department_id' => $youthDepartment->id,
    ]);
    $pastor = Pastor::factory()->for($section)->create();
    $encoder = User::factory()->registrationStaff()->create();

    $accessibleEvent = Event::factory()->create([
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $section->id,
        'department_id' => $youthDepartment->id,
    ]);
    $otherDepartmentEvent = Event::factory()->create([
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $section->id,
        'department_id' => $ladiesDepartment->id,
    ]);
    $otherSectionEvent = Event::factory()->create([
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $otherSection->id,
        'department_id' => $youthDepartment->id,
    ]);

    $accessibleRegistration = Registration::factory()
        ->for($accessibleEvent)
        ->for($pastor)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONSITE,
        ]);
    $otherDepartmentRegistration = Registration::factory()
        ->for($otherDepartmentEvent)
        ->for($pastor)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONSITE,
        ]);
    $otherSectionRegistration = Registration::factory()
        ->for($otherSectionEvent)
        ->for(Pastor::factory()->for($otherSection)->create())
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONSITE,
        ]);

    $gate = Gate::forUser($manager);

    expect($gate->allows('createOnsite', [Registration::class, $pastor, $accessibleEvent]))->toBeTrue();
    expect($gate->allows('createOnsite', [Registration::class, $pastor, $otherDepartmentEvent]))->toBeFalse();
    expect($gate->allows('createOnsite', [Registration::class, $pastor, $otherSectionEvent]))->toBeFalse();
    expect($gate->allows('updateOnsite', $accessibleRegistration))->toBeTrue();
    expect($gate->allows('updateOnsite', $otherDepartmentRegistration))->toBeFalse();
    expect($gate->allows('updateOnsite', $otherSectionRegistration))->toBeFalse();
});

test('online registrants are limited to their assigned pastor', function () {
    $context = authorizationContext();
    $onlineRegistrant = User::factory()->onlineRegistrant()->create([
        'pastor_id' => $context['pastorInSection']->id,
    ]);
    $ownOnlineRegistration = Registration::factory()
        ->for($context['event'])
        ->for($context['pastorInSection'])
        ->for($onlineRegistrant, 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
        ]);
    $otherOnlineRegistration = Registration::factory()
        ->for($context['event'])
        ->for($context['pastorOutsideSection'])
        ->for(User::factory()->registrationStaff()->create(), 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
        ]);

    $gate = Gate::forUser($onlineRegistrant);

    expect($gate->allows('viewAny', Event::class))->toBeFalse();
    expect($gate->allows('viewAny', EventFeeCategory::class))->toBeTrue();
    expect($gate->allows('viewAnyOnline', Registration::class))->toBeTrue();
    expect($gate->allows('viewAny', Pastor::class))->toBeFalse();
    expect($gate->allows('view', $context['pastorInSection']))->toBeTrue();
    expect($gate->allows('view', $context['pastorOutsideSection']))->toBeFalse();
    expect($gate->allows('createOnline', [Registration::class, $context['pastorInSection']]))->toBeTrue();
    expect($gate->allows('createOnline', [Registration::class, $context['pastorOutsideSection']]))->toBeFalse();
    expect($gate->allows('createOnsite', [Registration::class, $context['pastorInSection']]))->toBeFalse();
    expect($gate->allows('view', $ownOnlineRegistration))->toBeTrue();
    expect($gate->allows('view', $otherOnlineRegistration))->toBeFalse();
    expect($gate->allows('uploadReceipt', $ownOnlineRegistration))->toBeTrue();
    expect($gate->allows('uploadReceipt', $otherOnlineRegistration))->toBeFalse();
    expect($gate->allows('viewAnyVerification', Registration::class))->toBeFalse();
    expect($gate->allows('viewReports'))->toBeFalse();
    expect($gate->allows('create', Event::class))->toBeFalse();
    expect($gate->allows('update', $context['pastorInSection']))->toBeFalse();
});

test('pending online registrants cannot access the online registration area until approved', function () {
    $context = authorizationContext();
    $pendingRegistrant = User::factory()
        ->onlineRegistrant()
        ->pendingApproval()
        ->create([
            'pastor_id' => $context['pastorInSection']->id,
            'section_id' => $context['section']->id,
            'district_id' => $context['district']->id,
        ]);

    $gate = Gate::forUser($pendingRegistrant);

    expect($gate->allows('viewAnyOnline', Registration::class))->toBeFalse();
    expect($gate->allows('createOnline', [Registration::class, $context['pastorInSection']]))->toBeFalse();
    expect($gate->allows('view', $context['pastorInSection']))->toBeTrue();
});

test('inactive users fail authorization checks even when their role would normally allow access', function () {
    $context = authorizationContext();
    $inactiveManager = User::factory()->manager()->inactive()->create([
        'section_id' => $context['section']->id,
    ]);

    $gate = Gate::forUser($inactiveManager);

    expect($gate->allows('view', $context['section']))->toBeFalse();
    expect($gate->allows('createOnsite', [Registration::class, $context['pastorInSection']]))->toBeFalse();
    expect($gate->allows('update', $context['onlineRegistrationInSection']))->toBeFalse();
    expect($gate->allows('viewAnyVerification', Registration::class))->toBeFalse();
    expect($gate->allows('viewReports'))->toBeFalse();
});

function authorizationContext(): array
{
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $otherSection = Section::factory()->for($district)->create();
    $youthDepartment = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $ladiesDepartment = Department::factory()->create([
        'name' => 'Ladies Ministries',
    ]);
    $pastorInSection = Pastor::factory()->for($section)->create();
    $pastorOutsideSection = Pastor::factory()->for($otherSection)->create();
    $event = Event::factory()->create();
    $event->update([
        'district_id' => $district->id,
    ]);
    $districtFeeCategory = EventFeeCategory::factory()->for($event)->create();
    $sectionEvent = Event::factory()->create([
        'district_id' => $district->id,
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $section->id,
    ]);
    $sectionFeeCategory = EventFeeCategory::factory()->for($sectionEvent)->create();
    $otherSectionEvent = Event::factory()->create([
        'district_id' => $district->id,
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $otherSection->id,
    ]);
    $otherSectionFeeCategory = EventFeeCategory::factory()->for($otherSectionEvent)->create();
    $departmentDistrictEvent = Event::factory()->create([
        'district_id' => $district->id,
        'department_id' => $youthDepartment->id,
    ]);
    $departmentDistrictFeeCategory = EventFeeCategory::factory()->for($departmentDistrictEvent)->create();
    $otherDepartmentDistrictEvent = Event::factory()->create([
        'district_id' => $district->id,
        'department_id' => $ladiesDepartment->id,
    ]);
    $otherDepartmentDistrictFeeCategory = EventFeeCategory::factory()->for($otherDepartmentDistrictEvent)->create();
    $departmentSectionEvent = Event::factory()->create([
        'district_id' => $district->id,
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $section->id,
        'department_id' => $youthDepartment->id,
    ]);
    $departmentSectionFeeCategory = EventFeeCategory::factory()->for($departmentSectionEvent)->create();
    $otherDepartmentSectionEvent = Event::factory()->create([
        'district_id' => $district->id,
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $section->id,
        'department_id' => $ladiesDepartment->id,
    ]);
    $otherDepartmentSectionFeeCategory = EventFeeCategory::factory()->for($otherDepartmentSectionEvent)->create();
    $encoder = User::factory()->withRole(Role::REGISTRATION_STAFF)->create();
    $onlineRegistrationInSection = Registration::factory()
        ->for($event)
        ->for($pastorInSection)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);
    $onlineRegistrationOutsideSection = Registration::factory()
        ->for($event)
        ->for($pastorOutsideSection)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);
    $districtOnlineRegistration = Registration::factory()
        ->for($event)
        ->for($pastorOutsideSection)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);
    $sectionVerificationRegistration = Registration::factory()
        ->for($sectionEvent)
        ->for($pastorInSection)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);
    RegistrationItem::factory()
        ->for($sectionVerificationRegistration)
        ->for($sectionFeeCategory, 'feeCategory')
        ->create();
    $outsideSectionVerificationRegistration = Registration::factory()
        ->for($otherSectionEvent)
        ->for($pastorOutsideSection)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);
    RegistrationItem::factory()
        ->for($outsideSectionVerificationRegistration)
        ->for($otherSectionFeeCategory, 'feeCategory')
        ->create();
    $departmentDistrictRegistration = Registration::factory()
        ->for($departmentDistrictEvent)
        ->for($pastorInSection)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);
    RegistrationItem::factory()
        ->for($departmentDistrictRegistration)
        ->for($departmentDistrictFeeCategory, 'feeCategory')
        ->create();
    $otherDepartmentDistrictRegistration = Registration::factory()
        ->for($otherDepartmentDistrictEvent)
        ->for($pastorInSection)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);
    RegistrationItem::factory()
        ->for($otherDepartmentDistrictRegistration)
        ->for($otherDepartmentDistrictFeeCategory, 'feeCategory')
        ->create();
    $departmentSectionVerificationRegistration = Registration::factory()
        ->for($departmentSectionEvent)
        ->for($pastorInSection)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);
    RegistrationItem::factory()
        ->for($departmentSectionVerificationRegistration)
        ->for($departmentSectionFeeCategory, 'feeCategory')
        ->create();
    $otherDepartmentSectionVerificationRegistration = Registration::factory()
        ->for($otherDepartmentSectionEvent)
        ->for($pastorInSection)
        ->for($encoder, 'encodedByUser')
        ->create([
            'registration_mode' => 'online',
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
        ]);
    RegistrationItem::factory()
        ->for($otherDepartmentSectionVerificationRegistration)
        ->for($otherDepartmentSectionFeeCategory, 'feeCategory')
        ->create();
    $pendingRegistrantRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $district->id,
            'section_id' => $section->id,
            'pastor_id' => $pastorInSection->id,
        ]);
    RegistrationItem::factory()
        ->for($onlineRegistrationInSection)
        ->for($districtFeeCategory, 'feeCategory')
        ->create();
    RegistrationItem::factory()
        ->for($onlineRegistrationOutsideSection)
        ->for($districtFeeCategory, 'feeCategory')
        ->create();
    RegistrationItem::factory()
        ->for($districtOnlineRegistration)
        ->for($districtFeeCategory, 'feeCategory')
        ->create();

    return compact(
        'district',
        'section',
        'otherSection',
        'youthDepartment',
        'ladiesDepartment',
        'pastorInSection',
        'pastorOutsideSection',
        'event',
        'onlineRegistrationInSection',
        'onlineRegistrationOutsideSection',
        'districtOnlineRegistration',
        'sectionVerificationRegistration',
        'outsideSectionVerificationRegistration',
        'departmentDistrictRegistration',
        'otherDepartmentDistrictRegistration',
        'departmentSectionVerificationRegistration',
        'otherDepartmentSectionVerificationRegistration',
        'pendingRegistrantRequest',
    );
}
