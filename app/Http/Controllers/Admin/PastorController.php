<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePastorRequest;
use App\Http\Requests\Admin\UpdatePastorRequest;
use App\Models\Pastor;
use App\Models\Section;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PastorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('admin/pastors/index', [
            'pastors' => Pastor::query()
                ->with('section:id,name,district_id', 'section.district:id,name')
                ->orderBy('church_name')
                ->get()
                ->map(fn (Pastor $pastor): array => [
                    'id' => $pastor->id,
                    'pastor_name' => $pastor->pastor_name,
                    'church_name' => $pastor->church_name,
                    'contact_number' => $pastor->contact_number,
                    'email' => $pastor->email,
                    'address' => $pastor->address,
                    'status' => $pastor->status,
                    'section' => [
                        'id' => $pastor->section->id,
                        'name' => $pastor->section->name,
                    ],
                    'district' => [
                        'id' => $pastor->section->district->id,
                        'name' => $pastor->section->district->name,
                    ],
                ]),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('admin/pastors/create', [
            'sections' => $this->sectionOptions(),
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePastorRequest $request): RedirectResponse
    {
        Pastor::query()->create($request->validated());

        return to_route('admin.pastors.index')->with('success', 'Pastor record created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Pastor $pastor): Response
    {
        Gate::authorize('update', $pastor);

        $pastor->load('section:id,name,district_id', 'section.district:id,name');

        return Inertia::render('admin/pastors/edit', [
            'pastor' => $this->pastorData($pastor),
            'sections' => $this->sectionOptions(),
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePastorRequest $request, Pastor $pastor): RedirectResponse
    {
        $pastor->update($request->validated());

        return to_route('admin.pastors.index')->with('success', 'Pastor record updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pastor $pastor): RedirectResponse
    {
        Gate::authorize('delete', $pastor);

        $pastor->delete();

        return to_route('admin.pastors.index')->with('success', 'Pastor record deleted successfully.');
    }

    /**
     * Build section options for pastor forms.
     *
     * @return array<int, array<string, mixed>>
     */
    private function sectionOptions(): array
    {
        return Section::query()
            ->with('district:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (Section $section): array => [
                'id' => $section->id,
                'name' => $section->name,
                'district_name' => $section->district->name,
            ])
            ->all();
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

    /**
     * Transform a pastor record for the admin form pages.
     *
     * @return array<string, mixed>
     */
    private function pastorData(Pastor $pastor): array
    {
        return [
            'id' => $pastor->id,
            'pastor_name' => $pastor->pastor_name,
            'church_name' => $pastor->church_name,
            'contact_number' => $pastor->contact_number,
            'email' => $pastor->email,
            'address' => $pastor->address,
            'status' => $pastor->status,
            'section' => [
                'id' => $pastor->section->id,
                'name' => $pastor->section->name,
                'district_name' => $pastor->section->district->name,
            ],
        ];
    }
}
