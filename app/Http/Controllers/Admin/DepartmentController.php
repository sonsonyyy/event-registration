<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexDepartmentRequest;
use App\Http\Requests\Admin\StoreDepartmentRequest;
use App\Http\Requests\Admin\UpdateDepartmentRequest;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(IndexDepartmentRequest $request): Response
    {
        return Inertia::render('admin/departments/index', [
            'departments' => Department::query()
                ->withCount(['assignedUsers', 'events'])
                ->orderBy('name')
                ->get()
                ->map(fn (Department $department): array => [
                    'id' => $department->id,
                    'name' => $department->name,
                    'description' => $department->description,
                    'status' => $department->status,
                    'assigned_users_count' => $department->assigned_users_count,
                    'events_count' => $department->events_count,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/departments/create', [
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    public function store(StoreDepartmentRequest $request): RedirectResponse
    {
        Department::query()->create($request->validated());

        return to_route('admin.departments.index')->with('success', 'Department created.');
    }

    public function edit(Department $department): Response
    {
        Gate::authorize('update', $department);

        return Inertia::render('admin/departments/edit', [
            'department' => $this->departmentData($department),
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    public function update(
        UpdateDepartmentRequest $request,
        Department $department,
    ): RedirectResponse {
        $department->update($request->validated());

        return to_route('admin.departments.index')->with('success', 'Department updated.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        Gate::authorize('delete', $department);

        $department->delete();

        return to_route('admin.departments.index')->with('success', 'Department archived.');
    }

    /**
     * @return array<string, mixed>
     */
    private function departmentData(Department $department): array
    {
        return [
            'id' => $department->id,
            'name' => $department->name,
            'description' => $department->description,
            'status' => $department->status,
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function statusOptions(): array
    {
        return [
            ['value' => 'active', 'label' => 'Active'],
            ['value' => 'inactive', 'label' => 'Inactive'],
        ];
    }
}
