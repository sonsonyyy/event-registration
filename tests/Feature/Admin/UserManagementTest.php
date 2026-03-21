<?php

use App\Models\Department;
use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can browse the user management pages', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $department = Department::factory()->create();
    $section = Section::factory()->for($district)->create();
    $pastor = Pastor::factory()->for($section)->create();
    $managedUser = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);
    User::factory()->manager()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->has('users.data', 2)
            ->where('filters.section_id', null)
            ->where('filters.role_id', null)
            ->where('filters.status', null)
            ->where('filters.search', '')
            ->where('filters.per_page', 10)
            ->has('sections', 1)
            ->has('roles', 4)
            ->has('statusOptions', 2)
            ->has('perPageOptions', 3));

    $this->actingAs($admin)
        ->get(route('admin.users.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/create')
            ->has('roles', 4)
            ->has('departments', 1)
            ->has('districts', 1)
            ->has('sections', 1)
            ->has('pastors', 1)
            ->has('statusOptions', 2));

    $onlineRegistrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
        'pastor_id' => $pastor->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.users.edit', $onlineRegistrant))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/edit')
            ->where('userRecord.email', $onlineRegistrant->email)
            ->where('userRecord.department_id', null)
            ->where('userRecord.pastor_id', $pastor->id));
});

test('admins can search and paginate users', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);

    User::factory()->manager()->create([
        'name' => 'North Section Account',
        'email' => 'north-manager@example.com',
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);

    User::factory()->manager()->create([
        'name' => 'South Section Account',
        'email' => 'south-manager@example.com',
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);

    User::factory()->registrationStaff()->create([
        'name' => 'Registration Encoder',
        'email' => 'encoder@example.com',
        'district_id' => $district->id,
    ]);

    User::factory()->manager()->create([
        'name' => 'Outside District Manager',
        'email' => 'outside-manager@example.com',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.users.index', [
            'search' => 'Manager',
            'per_page' => 1,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('filters.section_id', null)
            ->where('filters.role_id', null)
            ->where('filters.status', null)
            ->where('filters.search', 'Manager')
            ->where('filters.per_page', 1)
            ->has('users.data', 1)
            ->where('users.meta.total', 2)
            ->where('users.meta.last_page', 2));
});

test('admins can filter users by section, role, and status', function () {
    $northDistrict = District::factory()->create([
        'name' => 'North District',
    ]);
    $admin = User::factory()->admin()->create([
        'district_id' => $northDistrict->id,
    ]);
    $southDistrict = District::factory()->create([
        'name' => 'South District',
    ]);
    $northSection = Section::factory()->for($northDistrict)->create([
        'name' => 'Section 1',
    ]);
    $southSection = Section::factory()->for($southDistrict)->create([
        'name' => 'Section 2',
    ]);

    $matchingUser = User::factory()->manager()->inactive()->create([
        'name' => 'Filtered Manager',
        'section_id' => $northSection->id,
        'district_id' => $northDistrict->id,
    ]);

    User::factory()->manager()->create([
        'name' => 'Active Manager',
        'section_id' => $northSection->id,
        'district_id' => $northDistrict->id,
    ]);

    User::factory()->manager()->inactive()->create([
        'name' => 'Other Section Manager',
        'section_id' => $southSection->id,
        'district_id' => $southDistrict->id,
    ]);

    User::factory()->registrationStaff()->inactive()->create([
        'name' => 'Inactive Staff',
        'section_id' => $northSection->id,
        'district_id' => $northDistrict->id,
    ]);

    $managerRole = Role::query()->where('name', Role::MANAGER)->firstOrFail();

    $this->actingAs($admin)
        ->get(route('admin.users.index', [
            'section_id' => $northSection->id,
            'role_id' => $managerRole->id,
            'status' => User::STATUS_INACTIVE,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('filters.section_id', $northSection->id)
            ->where('filters.role_id', $managerRole->id)
            ->where('filters.status', User::STATUS_INACTIVE)
            ->where('users.meta.total', 1)
            ->has('users.data', 1)
            ->where('users.data.0.id', $matchingUser->id)
            ->where('users.data.0.name', 'Filtered Manager'));
});

test('non admins cannot access admin user management routes', function () {
    $manager = User::factory()->manager()->create();

    $this->actingAs($manager)
        ->get(route('admin.users.index'))
        ->assertForbidden();

    $this->actingAs($manager)
        ->post(route('admin.users.store'), [])
        ->assertForbidden();
});

test('admins can create users with role and scope assignments', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $department = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $section = Section::factory()->for($district)->create();
    $pastor = Pastor::factory()->for($section)->create();
    $managerRole = Role::query()->firstOrCreate([
        'name' => Role::MANAGER,
    ]);
    $onlineRegistrantRole = Role::query()->firstOrCreate([
        'name' => Role::ONLINE_REGISTRANT,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Section Manager',
            'email' => 'manager.new@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role_id' => $managerRole->id,
            'district_id' => $district->id,
            'department_id' => $department->id,
            'section_id' => $section->id,
            'pastor_id' => null,
            'position_title' => 'Section President',
            'status' => 'active',
        ])
        ->assertRedirect(route('admin.users.index'));

    $createdManager = User::query()->where('email', 'manager.new@example.com')->firstOrFail();

    expect($createdManager->roleName())->toBe(Role::MANAGER)
        ->and($createdManager->district_id)->toBe($district->id)
        ->and($createdManager->department_id)->toBe($department->id)
        ->and($createdManager->section_id)->toBe($section->id)
        ->and($createdManager->pastor_id)->toBeNull()
        ->and($createdManager->position_title)->toBe('Section President')
        ->and($createdManager->email_verified_at)->not->toBeNull();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Church Registrant',
            'email' => 'registrant.new@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role_id' => $onlineRegistrantRole->id,
            'district_id' => '',
            'department_id' => '',
            'section_id' => '',
            'pastor_id' => $pastor->id,
            'position_title' => 'Church Secretary',
            'status' => 'inactive',
        ])
        ->assertRedirect(route('admin.users.index'));

    $createdRegistrant = User::query()->where('email', 'registrant.new@example.com')->firstOrFail();

    expect($createdRegistrant->roleName())->toBe(Role::ONLINE_REGISTRANT)
        ->and($createdRegistrant->district_id)->toBe($district->id)
        ->and($createdRegistrant->section_id)->toBe($section->id)
        ->and($createdRegistrant->pastor_id)->toBe($pastor->id)
        ->and($createdRegistrant->position_title)->toBe('Church Secretary')
        ->and($createdRegistrant->status)->toBe('inactive');
});

test('admins must satisfy role and scope validation rules when creating users', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $department = Department::factory()->create();
    $otherDistrict = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $otherSection = Section::factory()->for($otherDistrict)->create();
    $pastor = Pastor::factory()->for($otherSection)->create();
    $managerRole = Role::query()->firstOrCreate([
        'name' => Role::MANAGER,
    ]);
    $onlineRegistrantRole = Role::query()->firstOrCreate([
        'name' => Role::ONLINE_REGISTRANT,
    ]);

    $this->actingAs($admin)
        ->from(route('admin.users.create'))
        ->post(route('admin.users.store'), [
            'name' => '',
            'email' => 'manager@example',
            'password' => 'password',
            'password_confirmation' => 'mismatch',
            'role_id' => $managerRole->id,
            'district_id' => $district->id,
            'department_id' => 999999,
            'section_id' => '',
            'pastor_id' => $pastor->id,
            'position_title' => str_repeat('A', 256),
            'status' => 'archived',
        ])
        ->assertRedirect(route('admin.users.create'))
        ->assertSessionHasErrors([
            'name',
            'email',
            'password',
            'department_id',
            'section_id',
            'pastor_id',
            'position_title',
            'status',
        ]);

    $this->actingAs($admin)
        ->from(route('admin.users.create'))
        ->post(route('admin.users.store'), [
            'name' => 'Church Account',
            'email' => 'church-account@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role_id' => $onlineRegistrantRole->id,
            'district_id' => $district->id,
            'department_id' => $department->id,
            'section_id' => $section->id,
            'pastor_id' => '',
            'position_title' => 'Church President',
            'status' => 'active',
        ])
        ->assertRedirect(route('admin.users.create'))
        ->assertSessionHasErrors(['pastor_id']);
});

test('admins can update users and replace their scope assignment', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $department = Department::factory()->create([
        'name' => 'Youth Ministries',
    ]);
    $replacementDepartment = Department::factory()->create([
        'name' => 'Music Commission',
    ]);
    $section = Section::factory()->for($district)->create();
    $pastor = Pastor::factory()->for($section)->create();
    $replacementPastor = Pastor::factory()->for($section)->create();
    $managedUser = User::factory()->manager()->create([
        'district_id' => $district->id,
        'department_id' => $department->id,
        'section_id' => $section->id,
        'position_title' => 'Section President',
    ]);
    $onlineRegistrantRole = Role::query()->firstOrCreate([
        'name' => Role::ONLINE_REGISTRANT,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $managedUser), [
            'name' => 'Updated Registrant',
            'email' => 'updated.registrant@example.com',
            'password' => '',
            'password_confirmation' => '',
            'role_id' => $onlineRegistrantRole->id,
            'district_id' => $district->id,
            'department_id' => $replacementDepartment->id,
            'section_id' => $section->id,
            'pastor_id' => $replacementPastor->id,
            'position_title' => 'Church Secretary',
            'status' => 'inactive',
        ])
        ->assertRedirect(route('admin.users.index'));

    $managedUser->refresh();

    expect($managedUser->name)->toBe('Updated Registrant')
        ->and($managedUser->email)->toBe('updated.registrant@example.com')
        ->and($managedUser->roleName())->toBe(Role::ONLINE_REGISTRANT)
        ->and($managedUser->district_id)->toBe($district->id)
        ->and($managedUser->department_id)->toBe($replacementDepartment->id)
        ->and($managedUser->section_id)->toBe($section->id)
        ->and($managedUser->pastor_id)->toBe($replacementPastor->id)
        ->and($managedUser->position_title)->toBe('Church Secretary')
        ->and($managedUser->status)->toBe('inactive');
});

test('admins can delete users but not their own account', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $managedUser = User::factory()->registrationStaff()->create([
        'district_id' => $district->id,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $managedUser))
        ->assertRedirect(route('admin.users.index'));

    $this->assertSoftDeleted('users', [
        'id' => $managedUser->id,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin))
        ->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseHas('users', [
        'id' => $admin->id,
    ]);
});

test('admins can create a replacement account with the email of an archived user', function () {
    $district = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $archivedUser = User::factory()->registrationStaff()->create([
        'email' => 'archived-user@example.com',
        'district_id' => $district->id,
    ]);
    $role = Role::query()->firstOrCreate([
        'name' => Role::REGISTRATION_STAFF,
    ]);

    $archivedUser->delete();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Replacement Staff',
            'email' => 'archived-user@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role_id' => $role->id,
            'district_id' => $district->id,
            'section_id' => null,
            'pastor_id' => null,
            'status' => 'active',
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'archived-user@example.com',
        'name' => 'Replacement Staff',
        'deleted_at' => null,
    ]);
});

test('admins cannot update users outside their assigned district', function () {
    $district = District::factory()->create();
    $otherDistrict = District::factory()->create();
    $admin = User::factory()->admin()->create([
        'district_id' => $district->id,
    ]);
    $otherSection = Section::factory()->for($otherDistrict)->create();
    $otherPastor = Pastor::factory()->for($otherSection)->create();
    $managedUser = User::factory()->registrationStaff()->create([
        'district_id' => $otherDistrict->id,
    ]);
    $role = Role::query()->firstOrCreate([
        'name' => Role::ONLINE_REGISTRANT,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $managedUser), [
            'name' => 'Cross District Update',
            'email' => 'cross-district@example.com',
            'password' => '',
            'password_confirmation' => '',
            'role_id' => $role->id,
            'district_id' => $otherDistrict->id,
            'department_id' => '',
            'section_id' => $otherSection->id,
            'pastor_id' => $otherPastor->id,
            'position_title' => 'Church Secretary',
            'status' => 'active',
        ])
        ->assertForbidden();
});
