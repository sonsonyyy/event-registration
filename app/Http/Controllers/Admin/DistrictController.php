<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDistrictRequest;
use App\Http\Requests\Admin\UpdateDistrictRequest;
use App\Models\District;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DistrictController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('admin/districts/index', [
            'districts' => District::query()
                ->withCount('sections')
                ->orderBy('name')
                ->get()
                ->map(fn (District $district): array => [
                    'id' => $district->id,
                    'name' => $district->name,
                    'description' => $district->description,
                    'status' => $district->status,
                    'sections_count' => $district->sections_count,
                ]),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('admin/districts/create', [
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDistrictRequest $request): RedirectResponse
    {
        District::query()->create($request->validated());

        return to_route('admin.districts.index')->with('success', 'District created.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(District $district): Response
    {
        Gate::authorize('update', $district);

        return Inertia::render('admin/districts/edit', [
            'district' => $this->districtData($district),
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDistrictRequest $request, District $district): RedirectResponse
    {
        $district->update($request->validated());

        return to_route('admin.districts.index')->with('success', 'District updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(District $district): RedirectResponse
    {
        Gate::authorize('delete', $district);

        $district->delete();

        return to_route('admin.districts.index')->with('success', 'District deleted.');
    }

    /**
     * Transform a district for the admin form pages.
     *
     * @return array<string, mixed>
     */
    private function districtData(District $district): array
    {
        return [
            'id' => $district->id,
            'name' => $district->name,
            'description' => $district->description,
            'status' => $district->status,
        ];
    }

    /**
     * Build the common status options.
     *
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
