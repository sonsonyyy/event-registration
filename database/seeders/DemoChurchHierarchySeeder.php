<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\Pastor;
use App\Models\Section;
use Illuminate\Database\Seeder;

class DemoChurchHierarchySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->districtDefinitions() as $districtDefinition) {
            $district = District::query()
                ->where(function ($query) use ($districtDefinition): void {
                    $query->where('name', $districtDefinition['name']);

                    if ($districtDefinition['legacy_name'] !== null) {
                        $query->orWhere('name', $districtDefinition['legacy_name']);
                    }
                })
                ->first();

            if ($district === null) {
                $district = new District;
            }

            $district->fill([
                'name' => $districtDefinition['name'],
                'description' => $districtDefinition['description'],
                'status' => 'active',
            ])->save();

            foreach ($districtDefinition['sections'] as $sectionDefinition) {
                $section = Section::query()
                    ->where('district_id', $district->id)
                    ->where(function ($query) use ($sectionDefinition): void {
                        $query->where('name', $sectionDefinition['name']);

                        if ($sectionDefinition['legacy_name'] !== null) {
                            $query->orWhere('name', $sectionDefinition['legacy_name']);
                        }
                    })
                    ->first();

                if ($section === null) {
                    $section = new Section([
                        'district_id' => $district->id,
                    ]);
                }

                $section->fill([
                    'district_id' => $district->id,
                    'name' => $sectionDefinition['name'],
                    'description' => $sectionDefinition['description'],
                    'status' => 'active',
                ])->save();

                $pastorDefinitions = $this->pastorDefinitions(
                    $district->name,
                    $section->name,
                    $districtDefinition['legacy_name'],
                    $sectionDefinition['legacy_name'],
                );

                foreach ($pastorDefinitions as $pastorDefinition) {
                    $pastor = Pastor::query()
                        ->where('section_id', $section->id)
                        ->where(function ($query) use ($pastorDefinition): void {
                            $query->where('church_name', $pastorDefinition['church_name']);

                            if ($pastorDefinition['legacy_church_name'] !== null) {
                                $query->orWhere('church_name', $pastorDefinition['legacy_church_name']);
                            }
                        })
                        ->first();

                    if ($pastor === null) {
                        $pastor = new Pastor([
                            'section_id' => $section->id,
                        ]);
                    }

                    $pastor->fill([
                        'section_id' => $section->id,
                        'pastor_name' => $pastorDefinition['pastor_name'],
                        'church_name' => $pastorDefinition['church_name'],
                        'contact_number' => $pastorDefinition['contact_number'],
                        'email' => $pastorDefinition['email'],
                        'address' => $pastorDefinition['address'],
                        'status' => 'active',
                    ])->save();
                }

                $this->deleteObsoleteManagedPastors(
                    $section,
                    $district->name,
                    $section->name,
                    $districtDefinition['legacy_name'],
                    $sectionDefinition['legacy_name'],
                );
            }

            $this->deleteObsoleteManagedSections($district, $districtDefinition);
        }

        $this->deleteObsoleteManagedDistricts();
    }

    /**
     * @return array<int, array{
     *     name: string,
     *     legacy_name: string|null,
     *     description: string|null,
     *     sections: array<int, array{name: string, legacy_name: string|null, description: string|null}>
     * }>
     */
    protected function districtDefinitions(): array
    {
        return [
            [
                'name' => 'Central Luzon',
                'legacy_name' => 'Demo District',
                'description' => null,
                'sections' => [
                    [
                        'name' => 'Section 1',
                        'legacy_name' => 'North Section',
                        'description' => null,
                    ],
                    [
                        'name' => 'Section 2',
                        'legacy_name' => 'Central Section',
                        'description' => null,
                    ],
                    [
                        'name' => 'Section 3',
                        'legacy_name' => 'South Section',
                        'description' => null,
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<int, array{
     *     pastor_name: string,
     *     church_name: string,
     *     legacy_church_name: string|null,
     *     contact_number: string|null,
     *     email: string|null,
     *     address: string|null
     * }>
     */
    protected function pastorDefinitions(
        string $districtName,
        string $sectionName,
        ?string $legacyDistrictName = null,
        ?string $legacySectionName = null,
    ): array {
        return [];
    }

    private function deleteObsoleteManagedPastors(
        Section $section,
        string $districtName,
        string $sectionName,
        ?string $legacyDistrictName,
        ?string $legacySectionName,
    ): void {
        $managedChurchNames = $this->managedChurchNames(
            $districtName,
            $sectionName,
            $legacyDistrictName,
            $legacySectionName,
        );

        $desiredChurchNames = collect($this->pastorDefinitions(
            $districtName,
            $sectionName,
            $legacyDistrictName,
            $legacySectionName,
        ))->flatMap(fn (array $definition): array => array_filter([
            $definition['church_name'],
            $definition['legacy_church_name'],
        ]))
            ->unique()
            ->values()
            ->all();

        Pastor::query()
            ->where('section_id', $section->id)
            ->whereIn('church_name', $managedChurchNames)
            ->whereNotIn('church_name', $desiredChurchNames)
            ->whereDoesntHave('assignedUsers')
            ->whereDoesntHave('registrations')
            ->delete();
    }

    /**
     * @param  array{name: string, legacy_name: string|null, description: string|null, sections: array<int, array{name: string, legacy_name: string|null, description: string|null}>}  $districtDefinition
     */
    private function deleteObsoleteManagedSections(District $district, array $districtDefinition): void
    {
        $desiredSectionNames = collect($districtDefinition['sections'])
            ->pluck('name')
            ->all();

        $legacySectionNames = collect($districtDefinition['sections'])
            ->pluck('legacy_name')
            ->filter()
            ->all();

        Section::query()
            ->where('district_id', $district->id)
            ->whereIn('name', $legacySectionNames)
            ->whereNotIn('name', $desiredSectionNames)
            ->delete();
    }

    private function deleteObsoleteManagedDistricts(): void
    {
        District::query()
            ->whereIn('name', [
                'Demo District',
                'Mission District',
                'National Capital Region',
            ])
            ->delete();
    }

    /**
     * @return array<int, string>
     */
    private function managedChurchNames(
        string $districtName,
        string $sectionName,
        ?string $legacyDistrictName,
        ?string $legacySectionName,
    ): array {
        $churchNames = [];

        for ($index = 1; $index <= 5; $index++) {
            $churchNames[] = sprintf('%s %s Church %d', $districtName, $sectionName, $index);

            if ($legacyDistrictName !== null && $legacySectionName !== null) {
                $churchNames[] = sprintf('%s %s Church %d', $legacyDistrictName, $legacySectionName, $index);
            }
        }

        $churchNames[] = 'Grace Community Church';

        return array_values(array_unique($churchNames));
    }
}
