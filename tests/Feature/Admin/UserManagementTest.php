<?php

use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can browse the user management pages', function () {
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $pastor = Pastor::factory()->for($section)->create();
    $managedUser = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->has('users.data', 2)
            ->where('filters.search', '')
            ->where('filters.per_page', 10)
            ->has('perPageOptions', 3));

    $this->actingAs($admin)
        ->get(route('admin.users.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/create')
            ->has('roles', 4)
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
            ->where('userRecord.pastor_id', $pastor->id));
});

test('admins can search and paginate users', function () {
    $admin = User::factory()->admin()->create();

    User::factory()->manager()->create([
        'name' => 'North Section Account',
        'email' => 'north-manager@example.com',
    ]);

    User::factory()->manager()->create([
        'name' => 'South Section Account',
        'email' => 'south-manager@example.com',
    ]);

    User::factory()->registrationStaff()->create([
        'name' => 'Registration Encoder',
        'email' => 'encoder@example.com',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.users.index', [
            'search' => 'Manager',
            'per_page' => 1,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('filters.search', 'Manager')
            ->where('filters.per_page', 1)
            ->has('users.data', 1)
            ->where('users.meta.total', 2)
            ->where('users.meta.last_page', 2));
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
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create();
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
            'section_id' => $section->id,
            'pastor_id' => null,
            'status' => 'active',
        ])
        ->assertRedirect(route('admin.users.index'));

    $createdManager = User::query()->where('email', 'manager.new@example.com')->firstOrFail();

    expect($createdManager->roleName())->toBe(Role::MANAGER)
        ->and($createdManager->district_id)->toBe($district->id)
        ->and($createdManager->section_id)->toBe($section->id)
        ->and($createdManager->pastor_id)->toBeNull()
        ->and($createdManager->email_verified_at)->not->toBeNull();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Church Registrant',
            'email' => 'registrant.new@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role_id' => $onlineRegistrantRole->id,
            'district_id' => '',
            'section_id' => '',
            'pastor_id' => $pastor->id,
            'status' => 'inactive',
        ])
        ->assertRedirect(route('admin.users.index'));

    $createdRegistrant = User::query()->where('email', 'registrant.new@example.com')->firstOrFail();

    expect($createdRegistrant->roleName())->toBe(Role::ONLINE_REGISTRANT)
        ->and($createdRegistrant->district_id)->toBe($district->id)
        ->and($createdRegistrant->section_id)->toBe($section->id)
        ->and($createdRegistrant->pastor_id)->toBe($pastor->id)
        ->and($createdRegistrant->status)->toBe('inactive');
});

test('admins must satisfy role and scope validation rules when creating users', function () {
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create();
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
            'section_id' => '',
            'pastor_id' => $pastor->id,
            'status' => 'archived',
        ])
        ->assertRedirect(route('admin.users.create'))
        ->assertSessionHasErrors([
            'name',
            'email',
            'password',
            'section_id',
            'pastor_id',
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
            'section_id' => $section->id,
            'pastor_id' => '',
            'status' => 'active',
        ])
        ->assertRedirect(route('admin.users.create'))
        ->assertSessionHasErrors(['pastor_id']);
});

test('admins can update users and replace their scope assignment', function () {
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create();
    $otherDistrict = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $otherSection = Section::factory()->for($otherDistrict)->create();
    $pastor = Pastor::factory()->for($section)->create();
    $otherPastor = Pastor::factory()->for($otherSection)->create();
    $managedUser = User::factory()->manager()->create([
        'district_id' => $district->id,
        'section_id' => $section->id,
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
            'district_id' => '',
            'section_id' => '',
            'pastor_id' => $otherPastor->id,
            'status' => 'inactive',
        ])
        ->assertRedirect(route('admin.users.index'));

    $managedUser->refresh();

    expect($managedUser->name)->toBe('Updated Registrant')
        ->and($managedUser->email)->toBe('updated.registrant@example.com')
        ->and($managedUser->roleName())->toBe(Role::ONLINE_REGISTRANT)
        ->and($managedUser->district_id)->toBe($otherDistrict->id)
        ->and($managedUser->section_id)->toBe($otherSection->id)
        ->and($managedUser->pastor_id)->toBe($otherPastor->id)
        ->and($managedUser->status)->toBe('inactive');
});

test('admins can delete users but not their own account', function () {
    $admin = User::factory()->admin()->create();
    $managedUser = User::factory()->registrationStaff()->create();

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $managedUser))
        ->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseMissing('users', [
        'id' => $managedUser->id,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin))
        ->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseHas('users', [
        'id' => $admin->id,
    ]);
});
