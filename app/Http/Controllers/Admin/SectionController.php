<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSectionRequest;
use App\Http\Requests\Admin\UpdateSectionRequest;
use App\Models\District;
use App\Models\Section;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('admin/sections/index', [
            'sections' => Section::query()
                ->with('district:id,name')
                ->withCount('pastors')
                ->orderBy('name')
                ->get()
                ->map(fn (Section $section): array => [
                    'id' => $section->id,
                    'name' => $section->name,
                    'description' => $section->description,
                    'status' => $section->status,
                    'pastors_count' => $section->pastors_count,
                    'district' => [
                        'id' => $section->district->id,
                        'name' => $section->district->name,
                    ],
                ]),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('admin/sections/create', [
            'districts' => $this->districtOptions(),
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSectionRequest $request): RedirectResponse
    {
        Section::query()->create($request->validated());

        return to_route('admin.sections.index')->with('success', 'Section created.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Section $section): Response
    {
        Gate::authorize('update', $section);

        $section->load('district:id,name');

        return Inertia::render('admin/sections/edit', [
            'section' => $this->sectionData($section),
            'districts' => $this->districtOptions(),
            'statusOptions' => $this->statusOptions(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSectionRequest $request, Section $section): RedirectResponse
    {
        $section->update($request->validated());

        return to_route('admin.sections.index')->with('success', 'Section updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Section $section): RedirectResponse
    {
        Gate::authorize('delete', $section);

        $section->delete();

        return to_route('admin.sections.index')->with('success', 'Section archived.');
    }

    /**
     * Build district options for section forms.
     *
     * @return array<int, array<string, mixed>>
     */
    private function districtOptions(): array
    {
        return District::query()
            ->orderBy('name')
            ->get()
            ->map(fn (District $district): array => [
                'id' => $district->id,
                'name' => $district->name,
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
     * Transform a section for the admin form pages.
     *
     * @return array<string, mixed>
     */
    private function sectionData(Section $section): array
    {
        return [
            'id' => $section->id,
            'name' => $section->name,
            'description' => $section->description,
            'status' => $section->status,
            'district' => [
                'id' => $section->district->id,
                'name' => $section->district->name,
            ],
        ];
    }
}
