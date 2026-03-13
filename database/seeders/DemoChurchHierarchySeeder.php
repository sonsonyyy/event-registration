<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\Pastor;
use App\Models\Section;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

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

                foreach ($this->pastorDefinitions(
                    $district->name,
                    $section->name,
                    $districtDefinition['legacy_name'],
                    $sectionDefinition['legacy_name'],
                ) as $pastorDefinition) {
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
            }
        }
    }

    /**
     * @return array<int, array{
     *     name: string,
     *     legacy_name: string|null,
     *     description: string,
     *     sections: array<int, array{name: string, legacy_name: string|null, description: string}>
     * }>
     */
    protected function districtDefinitions(): array
    {
        return [
            [
                'name' => 'Central Luzon',
                'legacy_name' => 'Demo District',
                'description' => 'Primary seeded district for UI and access testing.',
                'sections' => [
                    [
                        'name' => 'Section 1',
                        'legacy_name' => 'North Section',
                        'description' => 'Seeded section assigned to the manager demo user.',
                    ],
                    [
                        'name' => 'Section 2',
                        'legacy_name' => 'Central Section',
                        'description' => 'Seeded section for admin CRUD testing.',
                    ],
                    [
                        'name' => 'Section 3',
                        'legacy_name' => 'South Section',
                        'description' => 'Seeded section for additional hierarchy coverage.',
                    ],
                ],
            ],
            [
                'name' => 'National Capital Region',
                'legacy_name' => 'Mission District',
                'description' => 'Secondary seeded district for admin CRUD testing.',
                'sections' => [
                    [
                        'name' => 'Section 1',
                        'legacy_name' => 'East Section',
                        'description' => 'Seeded section under National Capital Region.',
                    ],
                    [
                        'name' => 'Section 2',
                        'legacy_name' => 'West Section',
                        'description' => 'Seeded section under National Capital Region.',
                    ],
                    [
                        'name' => 'Section 3',
                        'legacy_name' => 'Valley Section',
                        'description' => 'Seeded section under National Capital Region.',
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
     *     contact_number: string,
     *     email: string,
     *     address: string
     * }>
     */
    protected function pastorDefinitions(
        string $districtName,
        string $sectionName,
        ?string $legacyDistrictName = null,
        ?string $legacySectionName = null,
    ): array {
        $pastors = [];

        for ($index = 1; $index <= 5; $index++) {
            $slug = Str::slug(sprintf('%s %s %d', $districtName, $sectionName, $index));
            $legacyChurchName = null;

            if ($legacyDistrictName !== null && $legacySectionName !== null) {
                $legacyChurchName = sprintf('%s %s Church %d', $legacyDistrictName, $legacySectionName, $index);
            }

            $pastors[] = [
                'pastor_name' => sprintf('Pastor %s %d', $sectionName, $index),
                'church_name' => sprintf('%s %s Church %d', $districtName, $sectionName, $index),
                'legacy_church_name' => $legacyChurchName,
                'contact_number' => sprintf('+63 912 34%02d %04d', strlen($districtName) + $index, strlen($sectionName) * 101 + $index),
                'email' => sprintf('%s@example.com', $slug),
                'address' => sprintf('%s Campus, %s', $sectionName, $districtName),
            ];
        }

        if ($districtName === 'Central Luzon' && $sectionName === 'Section 1') {
            $pastors[0] = [
                'pastor_name' => 'Pastor Jane Doe',
                'church_name' => 'Grace Community Church',
                'legacy_church_name' => 'Grace Community Church',
                'contact_number' => '+63 912 345 6789',
                'email' => 'grace@example.com',
                'address' => '123 Church Street',
            ];
        }

        return $pastors;
    }
}
