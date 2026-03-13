<?php

use App\Models\District;
use App\Models\Pastor;
use App\Models\Section;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can browse the master data pages', function () {
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $pastor = Pastor::factory()->for($section)->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.districts.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/districts/index')
            ->has('districts', 1));

    $this->actingAs($admin)
        ->get(route('admin.districts.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/districts/create')
            ->has('statusOptions', 2));

    $this->actingAs($admin)
        ->get(route('admin.districts.edit', $district))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/districts/edit')
            ->where('district.name', $district->name));

    $this->actingAs($admin)
        ->get(route('admin.sections.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/sections/index')
            ->has('sections', 1));

    $this->actingAs($admin)
        ->get(route('admin.sections.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/sections/create')
            ->has('districts', 1));

    $this->actingAs($admin)
        ->get(route('admin.sections.edit', $section))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/sections/edit')
            ->where('section.name', $section->name));

    $this->actingAs($admin)
        ->get(route('admin.pastors.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pastors/index')
            ->where('filters.search', '')
            ->where('filters.per_page', 10)
            ->has('perPageOptions', 3)
            ->has('pastors.data', 1)
            ->where('pastors.meta.total', 1));

    $this->actingAs($admin)
        ->get(route('admin.pastors.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pastors/create')
            ->has('sections', 1));

    $this->actingAs($admin)
        ->get(route('admin.pastors.edit', $pastor))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pastors/edit')
            ->where('pastor.church_name', $pastor->church_name));
});

test('non admins cannot access admin master data routes', function () {
    $manager = User::factory()->manager()->create();

    $this->actingAs($manager)
        ->get(route('admin.districts.index'))
        ->assertForbidden();

    $this->actingAs($manager)
        ->post(route('admin.districts.store'), [
            'name' => 'Restricted District',
            'status' => 'active',
        ])
        ->assertForbidden();
});

test('admins can create districts sections and pastors', function () {
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();

    $this->actingAs($admin)
        ->post(route('admin.districts.store'), [
            'name' => 'North District',
            'description' => 'Primary district record.',
            'status' => 'active',
        ])
        ->assertRedirect(route('admin.districts.index'));

    $this->assertDatabaseHas('districts', [
        'name' => 'North District',
        'status' => 'active',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.sections.store'), [
            'district_id' => $district->id,
            'name' => 'Central Section',
            'description' => 'Section description',
            'status' => 'active',
        ])
        ->assertRedirect(route('admin.sections.index'));

    $this->assertDatabaseHas('sections', [
        'district_id' => $district->id,
        'name' => 'Central Section',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.pastors.store'), [
            'section_id' => $section->id,
            'pastor_name' => 'Pastor Jane Doe',
            'church_name' => 'Grace Community Church',
            'contact_number' => '+63 912 345 6789',
            'email' => 'grace@example.com',
            'address' => '123 Church Street',
            'status' => 'active',
        ])
        ->assertRedirect(route('admin.pastors.index'));

    $this->assertDatabaseHas('pastors', [
        'section_id' => $section->id,
        'church_name' => 'Grace Community Church',
    ]);
});

test('admins can search and paginate the pastor directory', function () {
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();

    Pastor::factory()->for($section)->create([
        'church_name' => 'Grace Beacon Church',
        'pastor_name' => 'Pastor Alpha',
        'contact_number' => '09170000001',
        'email' => 'alpha@example.com',
    ]);

    Pastor::factory()->for($section)->create([
        'church_name' => 'Alpha Chapel',
        'pastor_name' => 'Grace Pastor',
        'contact_number' => '09170000002',
        'email' => 'beta@example.com',
    ]);

    Pastor::factory()->for($section)->create([
        'church_name' => 'Beta Ministries',
        'pastor_name' => 'Pastor Beta',
        'contact_number' => 'GRACE-0003',
        'email' => 'gamma@example.com',
    ]);

    Pastor::factory()->for($section)->create([
        'church_name' => 'Gamma Fellowship',
        'pastor_name' => 'Pastor Gamma',
        'contact_number' => '09170000004',
        'email' => 'grace-match@example.com',
    ]);

    Pastor::factory()->for($section)->create([
        'church_name' => 'Delta Outreach',
        'pastor_name' => 'Pastor Delta',
        'contact_number' => '09170000005',
        'email' => 'delta@example.com',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.pastors.index', [
            'search' => 'grace',
            'per_page' => 2,
            'page' => 2,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pastors/index')
            ->where('filters.search', 'grace')
            ->where('filters.per_page', 2)
            ->where('pastors.meta.current_page', 2)
            ->where('pastors.meta.last_page', 2)
            ->where('pastors.meta.total', 4)
            ->where('pastors.meta.from', 3)
            ->where('pastors.meta.to', 4)
            ->has('pastors.data', 2)
            ->where('pastors.data.0.church_name', 'Gamma Fellowship')
            ->where('pastors.data.1.church_name', 'Grace Beacon Church'));
});

test('admins must pass the form request validation rules', function () {
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create();
    $section = Section::factory()->for($district)->create();

    $this->actingAs($admin)
        ->from(route('admin.districts.create'))
        ->post(route('admin.districts.store'), [
            'name' => '',
            'status' => 'archived',
        ])
        ->assertRedirect(route('admin.districts.create'))
        ->assertSessionHasErrors(['name', 'status']);

    $this->actingAs($admin)
        ->from(route('admin.sections.create'))
        ->post(route('admin.sections.store'), [
            'district_id' => '',
            'name' => '',
            'status' => 'archived',
        ])
        ->assertRedirect(route('admin.sections.create'))
        ->assertSessionHasErrors(['district_id', 'name', 'status']);

    $this->actingAs($admin)
        ->from(route('admin.pastors.create'))
        ->post(route('admin.pastors.store'), [
            'section_id' => $section->id,
            'pastor_name' => '',
            'church_name' => '',
            'contact_number' => '',
            'status' => 'archived',
        ])
        ->assertRedirect(route('admin.pastors.create'))
        ->assertSessionHasErrors([
            'pastor_name',
            'church_name',
            'contact_number',
            'status',
        ]);
});

test('admins can update districts sections and pastors', function () {
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create();
    $replacementDistrict = District::factory()->create();
    $section = Section::factory()->for($district)->create();
    $replacementSection = Section::factory()->for($replacementDistrict)->create();
    $pastor = Pastor::factory()->for($section)->create();

    $this->actingAs($admin)
        ->patch(route('admin.districts.update', $district), [
            'name' => 'Updated District',
            'description' => 'Updated description',
            'status' => 'inactive',
        ])
        ->assertRedirect(route('admin.districts.index'));

    $this->assertDatabaseHas('districts', [
        'id' => $district->id,
        'name' => 'Updated District',
        'status' => 'inactive',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.sections.update', $section), [
            'district_id' => $replacementDistrict->id,
            'name' => 'Updated Section',
            'description' => 'Updated section description',
            'status' => 'inactive',
        ])
        ->assertRedirect(route('admin.sections.index'));

    $this->assertDatabaseHas('sections', [
        'id' => $section->id,
        'district_id' => $replacementDistrict->id,
        'name' => 'Updated Section',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.pastors.update', $pastor), [
            'section_id' => $replacementSection->id,
            'pastor_name' => 'Pastor Updated',
            'church_name' => 'Updated Church',
            'contact_number' => '09123456789',
            'email' => 'updated@example.com',
            'address' => 'Updated address',
            'status' => 'inactive',
        ])
        ->assertRedirect(route('admin.pastors.index'));

    $this->assertDatabaseHas('pastors', [
        'id' => $pastor->id,
        'section_id' => $replacementSection->id,
        'church_name' => 'Updated Church',
    ]);
});

test('admins can delete districts sections and pastors', function () {
    $admin = User::factory()->admin()->create();
    $district = District::factory()->create();
    $section = Section::factory()->create();
    $pastor = Pastor::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.districts.destroy', $district))
        ->assertRedirect(route('admin.districts.index'));
    $this->assertDatabaseMissing('districts', ['id' => $district->id]);

    $this->actingAs($admin)
        ->delete(route('admin.sections.destroy', $section))
        ->assertRedirect(route('admin.sections.index'));
    $this->assertDatabaseMissing('sections', ['id' => $section->id]);

    $this->actingAs($admin)
        ->delete(route('admin.pastors.destroy', $pastor))
        ->assertRedirect(route('admin.pastors.index'));
    $this->assertDatabaseMissing('pastors', ['id' => $pastor->id]);
});
