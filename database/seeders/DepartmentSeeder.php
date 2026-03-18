<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        collect([
            'Youth Ministries',
            'Ladies Ministries',
            "Apostolic Men's",
            'Sunday School',
            'Home Missions',
            'Music Commission',
            'Information Technology Commission',
        ])->each(function (string $departmentName): void {
            Department::query()->updateOrCreate(
                ['name' => $departmentName],
                [
                    'description' => null,
                    'status' => 'active',
                ],
            );
        });
    }
}
