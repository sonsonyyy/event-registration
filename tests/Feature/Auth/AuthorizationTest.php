<?php

use App\Models\District;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

test('admins can perform all protected actions', function () {
    $context = authorizationContext();
    $admin = User::factory()->admin()->create();

    $gate = Gate::forUser($admin);

    expect($gate->allows('create', Event::class))->toBeTrue();
    expect($gate->allows('update', $context['event']))->toBeTrue();
    expect($gate->allows('delete', $context['pastorOutsideSection']))->toBeTrue();
    expect($gate->allows('create', User::class))->toBeTrue();
    expect($gate->allows('verifyReceipt', $context['onlineRegistrationOutsideSection']))->toBeTrue();
    expect($gate->allows('viewAnyVerification', Registration::class))->toBeTrue();
    expect($gate->allows('viewReports'))->toBeTrue();
    expect($gate->allows('viewSectionReport', $context['section']))->toBeTrue();
    expect($gate->allows('viewPastorReport', $context['pastorOutsideSection']))->toBeTrue();
});

test('managers are limited to their assigned section', function () {
    $context = authorizationContext();
    $manager = User::factory()->manager()->create([
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
    expect($gate->allows('update', $context['onlineRegistrationInSection']))->toBeTrue();
    expect($gate->allows('update', $context['onlineRegistrationOutsideSection']))->toBeFalse();
    expect($gate->allows('verifyReceipt', $context['onlineRegistrationInSection']))->toBeTrue();
    expect($gate->allows('verifyReceipt', $context['onlineRegistrationOutsideSection']))->toBeFalse();
    expect($gate->allows('viewAnyVerification', Registration::class))->toBeTrue();
    expect($gate->allows('create', Event::class))->toBeFalse();
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
    $staff = User::factory()->registrationStaff()->create();
    $otherStaff = User::factory()->registrationStaff()->create();
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

    expect($gate->allows('viewAny', Event::class))->toBeTrue();
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

    expect($gate->allows('viewAny', Event::class))->toBeTrue();
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
    $pastorInSection = Pastor::factory()->for($section)->create();
    $pastorOutsideSection = Pastor::factory()->for($otherSection)->create();
    $event = Event::factory()->create();
    EventFeeCategory::factory()->for($event)->create();
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

    return compact(
        'district',
        'section',
        'otherSection',
        'pastorInSection',
        'pastorOutsideSection',
        'event',
        'onlineRegistrationInSection',
        'onlineRegistrationOutsideSection',
    );
}
