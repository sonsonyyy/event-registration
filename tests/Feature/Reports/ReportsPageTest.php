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
use Inertia\Testing\AssertableInertia as Assert;

test('admins can view event total registration and churches without registration reports', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $sectionOne = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $sectionTwo = Section::factory()->for($district)->create([
        'name' => 'Section 2',
    ]);
    $sectionThree = Section::factory()->for($district)->create([
        'name' => 'Section 3',
    ]);
    $pastorOne = Pastor::factory()->for($sectionOne)->create([
        'church_name' => 'Grace Community Church',
        'pastor_name' => 'Pastor Jane Doe',
    ]);
    $pastorTwo = Pastor::factory()->for($sectionOne)->create([
        'church_name' => 'Faith Harvest Church',
        'pastor_name' => 'Pastor Mark Lim',
    ]);
    $pastorThree = Pastor::factory()->for($sectionTwo)->create([
        'church_name' => 'River of Life Church',
        'pastor_name' => 'Pastor Joel Cruz',
    ]);
    $pastorFour = Pastor::factory()->for($sectionThree)->create([
        'church_name' => 'Hope Chapel',
        'pastor_name' => 'Pastor Anne Reyes',
    ]);
    $admin = User::factory()->admin()->create();
    $encoder = User::factory()->registrationStaff()->create();
    $event = reportEvent();
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);
    $oneDayPass = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'One-day Pass',
        'amount' => '600.00',
    ]);

    createReportedRegistration(
        $event,
        $pastorOne,
        $encoder,
        $regular,
        Registration::MODE_ONLINE,
        Registration::STATUS_PENDING_VERIFICATION,
        3,
    );

    createReportedRegistration(
        $event,
        $pastorOne,
        $encoder,
        $oneDayPass,
        Registration::MODE_ONLINE,
        Registration::STATUS_VERIFIED,
        2,
    );

    createReportedRegistration(
        $event,
        $pastorThree,
        $encoder,
        $regular,
        Registration::MODE_ONSITE,
        Registration::STATUS_COMPLETED,
        5,
    );

    $this->actingAs($admin)
        ->get(route('reports.index', [
            'event_id' => $event->id,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/index')
            ->where('scopeSummary', 'District events • all sections • all departments')
            ->where('filters.event_id', $event->id)
            ->where('filters.section_id', null)
            ->where('filters.search', '')
            ->where('filters.per_page', 10)
            ->where('selectedEvent.name', 'CLD Youth Conference 2026')
            ->where('eventTotalRegistration.total_registered_quantity', 10)
            ->where('eventTotalRegistration.registration_count', 3)
            ->where('eventTotalRegistration.verified_online_quantity', 2)
            ->where('eventTotalRegistration.pending_online_quantity', 3)
            ->where('eventTotalRegistration.fee_categories.0.category_name', 'Regular (Online)')
            ->where('eventTotalRegistration.fee_categories.0.registered_quantity', 8)
            ->where('eventTotalRegistration.fee_categories.1.registered_quantity', 2)
            ->has('churchesWithoutRegistration.data', 2)
            ->where('churchesWithoutRegistration.data.0.church_name', 'Faith Harvest Church')
            ->where('churchesWithoutRegistration.data.1.church_name', 'Hope Chapel')
            ->where('churchesWithoutRegistration.meta.total', 2));

    expect($pastorTwo->church_name)->not->toBe($pastorFour->church_name);
});

test('admins can filter and search churches without registration report', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $sectionOne = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $sectionThree = Section::factory()->for($district)->create([
        'name' => 'Section 3',
    ]);
    $pastorOne = Pastor::factory()->for($sectionOne)->create([
        'church_name' => 'Grace Community Church',
        'pastor_name' => 'Pastor Jane Doe',
    ]);
    Pastor::factory()->for($sectionOne)->create([
        'church_name' => 'Faith Harvest Church',
        'pastor_name' => 'Pastor Mark Lim',
    ]);
    $pastorThree = Pastor::factory()->for($sectionThree)->create([
        'church_name' => 'Hope Chapel',
        'pastor_name' => 'Pastor Anne Reyes',
    ]);
    $admin = User::factory()->admin()->create();
    $encoder = User::factory()->registrationStaff()->create();
    $event = reportEvent();
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);

    createReportedRegistration(
        $event,
        $pastorOne,
        $encoder,
        $regular,
        Registration::MODE_ONLINE,
        Registration::STATUS_PENDING_VERIFICATION,
        3,
    );

    $this->actingAs($admin)
        ->get(route('reports.index', [
            'event_id' => $event->id,
            'section_id' => $sectionThree->id,
            'search' => 'hope',
            'per_page' => 25,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/index')
            ->where('filters.section_id', $sectionThree->id)
            ->where('filters.search', 'hope')
            ->where('filters.per_page', 25)
            ->where('selectedSection.name', 'Section 3')
            ->where('churchesWithoutRegistration.meta.total', 1)
            ->has('churchesWithoutRegistration.data', 1)
            ->where('churchesWithoutRegistration.data.0.church_name', 'Hope Chapel')
            ->where('churchesWithoutRegistration.data.0.pastor_name', 'Pastor Anne Reyes'));

    expect($pastorThree->church_name)->toBe('Hope Chapel');
});

test('managers only see report data inside their assigned section', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $sectionOne = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $sectionTwo = Section::factory()->for($district)->create([
        'name' => 'Section 2',
    ]);
    $pastorOne = Pastor::factory()->for($sectionOne)->create([
        'church_name' => 'Grace Community Church',
        'pastor_name' => 'Pastor Jane Doe',
    ]);
    $pastorTwo = Pastor::factory()->for($sectionOne)->create([
        'church_name' => 'Faith Harvest Church',
        'pastor_name' => 'Pastor Mark Lim',
    ]);
    $pastorThree = Pastor::factory()->for($sectionTwo)->create([
        'church_name' => 'River of Life Church',
        'pastor_name' => 'Pastor Joel Cruz',
    ]);
    $manager = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $sectionOne->id,
    ]);
    $encoder = User::factory()->registrationStaff()->create();
    $event = reportEvent([
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $sectionOne->id,
    ]);
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);
    $oneDayPass = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'One-day Pass',
        'amount' => '600.00',
    ]);

    createReportedRegistration(
        $event,
        $pastorOne,
        $encoder,
        $regular,
        Registration::MODE_ONLINE,
        Registration::STATUS_PENDING_VERIFICATION,
        3,
    );

    createReportedRegistration(
        $event,
        $pastorOne,
        $encoder,
        $oneDayPass,
        Registration::MODE_ONLINE,
        Registration::STATUS_VERIFIED,
        2,
    );

    $outsideEvent = reportEvent([
        'scope_type' => Event::SCOPE_SECTION,
        'section_id' => $sectionTwo->id,
    ]);

    $outsideRegular = EventFeeCategory::factory()->for($outsideEvent)->create([
        'category_name' => 'Outside Section',
        'amount' => '500.00',
    ]);

    createReportedRegistration(
        $outsideEvent,
        $pastorThree,
        $encoder,
        $outsideRegular,
        Registration::MODE_ONSITE,
        Registration::STATUS_COMPLETED,
        5,
    );

    $this->actingAs($manager)
        ->get(route('reports.index', [
            'event_id' => $event->id,
            'section_id' => $sectionTwo->id,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/index')
            ->where('scopeSummary', 'Central Luzon • Section 1 • all departments')
            ->where('canFilterBySection', false)
            ->where('filters.section_id', $sectionOne->id)
            ->where('selectedSection.name', 'Section 1')
            ->where('eventTotalRegistration.total_registered_quantity', 5)
            ->where('eventTotalRegistration.registration_count', 2)
            ->where('eventTotalRegistration.verified_online_quantity', 2)
            ->where('eventTotalRegistration.pending_online_quantity', 3)
            ->where('eventTotalRegistration.fee_categories.0.registered_quantity', 3)
            ->where('eventTotalRegistration.fee_categories.1.registered_quantity', 2)
            ->where('churchesWithoutRegistration.meta.total', 1)
            ->has('churchesWithoutRegistration.data', 1)
            ->where('churchesWithoutRegistration.data.0.church_name', 'Faith Harvest Church'));

    expect($pastorTwo->church_name)->not->toBe($pastorThree->church_name);
});

test('department-scoped admins only see district report events for their department', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $section = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $pastor = Pastor::factory()->for($section)->create([
        'church_name' => 'Grace Community Church',
    ]);
    $adminDepartment = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $otherDepartment = Department::factory()->create([
        'name' => 'Ladies Ministries',
    ]);
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
        'department_id' => $adminDepartment->id,
    ]);
    $encoder = User::factory()->registrationStaff()->create();
    $accessibleEvent = reportEvent([
        'department_id' => $adminDepartment->id,
    ]);
    $inaccessibleEvent = reportEvent([
        'department_id' => $otherDepartment->id,
    ]);
    $accessibleFeeCategory = EventFeeCategory::factory()->for($accessibleEvent)->create([
        'category_name' => 'Regular',
        'amount' => '800.00',
    ]);
    EventFeeCategory::factory()->for($inaccessibleEvent)->create([
        'category_name' => 'Regular',
        'amount' => '800.00',
    ]);

    createReportedRegistration(
        $accessibleEvent,
        $pastor,
        $encoder,
        $accessibleFeeCategory,
        Registration::MODE_ONLINE,
        Registration::STATUS_PENDING_VERIFICATION,
        4,
    );

    $this->actingAs($admin)
        ->get(route('reports.index', [
            'event_id' => $inaccessibleEvent->id,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/index')
            ->where('scopeSummary', 'District events • Youth Ministries')
            ->has('events', 1)
            ->where('filters.event_id', $accessibleEvent->id)
            ->where('selectedEvent.name', $accessibleEvent->name)
            ->where('eventTotalRegistration.total_registered_quantity', 4)
            ->where('eventTotalRegistration.registration_count', 1)
            ->where('eventTotalRegistration.pending_online_quantity', 4));
});

test('admins can export churches without registration based on report scope', function () {
    $district = District::factory()->create([
        'name' => 'Central Luzon',
    ]);
    $sectionOne = Section::factory()->for($district)->create([
        'name' => 'Section 1',
    ]);
    $sectionThree = Section::factory()->for($district)->create([
        'name' => 'Section 3',
    ]);
    $pastorOne = Pastor::factory()->for($sectionOne)->create([
        'church_name' => 'Grace Community Church',
        'pastor_name' => 'Pastor Jane Doe',
    ]);
    Pastor::factory()->for($sectionOne)->create([
        'church_name' => 'Faith Harvest Church',
        'pastor_name' => 'Pastor Mark Lim',
    ]);
    $pastorThree = Pastor::factory()->for($sectionThree)->create([
        'church_name' => 'Hope Chapel',
        'pastor_name' => 'Pastor Anne Reyes',
    ]);
    $admin = User::factory()->admin()->create();
    $encoder = User::factory()->registrationStaff()->create();
    $event = reportEvent();
    $regular = EventFeeCategory::factory()->for($event)->create([
        'category_name' => 'Regular (Online)',
        'amount' => '800.00',
    ]);

    createReportedRegistration(
        $event,
        $pastorOne,
        $encoder,
        $regular,
        Registration::MODE_ONLINE,
        Registration::STATUS_PENDING_VERIFICATION,
        3,
    );

    $response = $this->actingAs($admin)
        ->get(route('reports.churches-without-registration.export', [
            'event_id' => $event->id,
            'section_id' => $sectionThree->id,
            'search' => 'hope',
        ]));

    $response->assertDownload('cld-youth-conference-2026-churches-without-registration-section-3.xls');

    $content = $response->streamedContent();

    expect($content)
        ->toContain('Pastor Anne Reyes')
        ->toContain('Hope Chapel')
        ->toContain('Section 3')
        ->not->toContain('Faith Harvest Church');

    expect($pastorThree->church_name)->toBe('Hope Chapel');
});

test('users without report access cannot open the reports page', function () {
    $staff = User::factory()->registrationStaff()->create();
    $registrant = User::factory()->onlineRegistrant()->create();
    $unassignedManager = User::factory()->manager()->create();

    foreach ([$staff, $registrant, $unassignedManager] as $user) {
        $this->actingAs($user)
            ->get(route('reports.index'))
            ->assertForbidden();
    }
});

function reportEvent(array $attributes = []): Event
{
    return Event::factory()->create([
        'name' => 'CLD Youth Conference 2026',
        'status' => Event::STATUS_OPEN,
        'total_capacity' => 2000,
        'registration_open_at' => now()->subDays(3),
        'registration_close_at' => now()->addDays(30),
        ...$attributes,
    ]);
}

function createReportedRegistration(
    Event $event,
    Pastor $pastor,
    User $encodedByUser,
    EventFeeCategory $feeCategory,
    string $mode,
    string $status,
    int $quantity,
): Registration {
    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($encodedByUser, 'encodedByUser')
        ->create([
            'registration_mode' => $mode,
            'payment_status' => Registration::PAYMENT_STATUS_PAID,
            'registration_status' => $status,
            'payment_reference' => fake()->bothify('REF-####'),
            'submitted_at' => now()->subHour(),
            'verified_at' => $status === Registration::STATUS_VERIFIED ? now()->subMinutes(30) : null,
            'verified_by_user_id' => $status === Registration::STATUS_VERIFIED ? $encodedByUser->id : null,
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create([
            'quantity' => $quantity,
            'unit_amount' => $feeCategory->amount,
            'subtotal_amount' => number_format((float) $feeCategory->amount * $quantity, 2, '.', ''),
            'remarks' => null,
        ]);

    return $registration;
}
