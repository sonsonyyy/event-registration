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
            $district = District::query()->updateOrCreate(
                ['name' => $districtDefinition['name']],
                [
                    'description' => $districtDefinition['description'],
                    'status' => 'active',
                ],
            );

            foreach ($districtDefinition['sections'] as $sectionDefinition) {
                $section = Section::query()->updateOrCreate(
                    [
                        'district_id' => $district->id,
                        'name' => $sectionDefinition['name'],
                    ],
                    [
                        'description' => $sectionDefinition['description'],
                        'status' => 'active',
                    ],
                );

                foreach ($this->pastorDefinitions($district->name, $section->name) as $pastorDefinition) {
                    Pastor::query()->updateOrCreate(
                        [
                            'section_id' => $section->id,
                            'church_name' => $pastorDefinition['church_name'],
                        ],
                        [
                            'pastor_name' => $pastorDefinition['pastor_name'],
                            'contact_number' => $pastorDefinition['contact_number'],
                            'email' => $pastorDefinition['email'],
                            'address' => $pastorDefinition['address'],
                            'status' => 'active',
                        ],
                    );
                }
            }
        }
    }

    /**
     * @return array<int, array{
     *     name: string,
     *     description: string,
     *     sections: array<int, array{name: string, description: string}>
     * }>
     */
    protected function districtDefinitions(): array
    {
        return [
            [
                'name' => 'Demo District',
                'description' => 'Primary seeded district for UI and access testing.',
                'sections' => [
                    [
                        'name' => 'North Section',
                        'description' => 'Seeded section assigned to the manager demo user.',
                    ],
                    [
                        'name' => 'Central Section',
                        'description' => 'Seeded section for admin CRUD testing.',
                    ],
                    [
                        'name' => 'South Section',
                        'description' => 'Seeded section for additional hierarchy coverage.',
                    ],
                ],
            ],
            [
                'name' => 'Mission District',
                'description' => 'Secondary seeded district for admin CRUD testing.',
                'sections' => [
                    [
                        'name' => 'East Section',
                        'description' => 'Seeded section under Mission District.',
                    ],
                    [
                        'name' => 'West Section',
                        'description' => 'Seeded section under Mission District.',
                    ],
                    [
                        'name' => 'Valley Section',
                        'description' => 'Seeded section under Mission District.',
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<int, array{
     *     pastor_name: string,
     *     church_name: string,
     *     contact_number: string,
     *     email: string,
     *     address: string
     * }>
     */
    protected function pastorDefinitions(string $districtName, string $sectionName): array
    {
        $pastors = [];

        for ($index = 1; $index <= 5; $index++) {
            $slug = Str::slug(sprintf('%s %s %d', $districtName, $sectionName, $index));

            $pastors[] = [
                'pastor_name' => sprintf('Pastor %s %d', $sectionName, $index),
                'church_name' => sprintf('%s %s Church %d', $districtName, $sectionName, $index),
                'contact_number' => sprintf('+63 912 34%02d %04d', strlen($districtName) + $index, strlen($sectionName) * 101 + $index),
                'email' => sprintf('%s@example.com', $slug),
                'address' => sprintf('%s Campus, %s', $sectionName, $districtName),
            ];
        }

        if ($districtName === 'Demo District' && $sectionName === 'North Section') {
            $pastors[0] = [
                'pastor_name' => 'Pastor Jane Doe',
                'church_name' => 'Grace Community Church',
                'contact_number' => '+63 912 345 6789',
                'email' => 'grace@example.com',
                'address' => '123 Church Street',
            ];
        }

        return $pastors;
    }
}
