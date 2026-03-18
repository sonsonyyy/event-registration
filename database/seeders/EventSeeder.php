<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Event;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(DepartmentSeeder::class);

        $youthDepartmentId = Department::query()
            ->where('name', 'Youth Ministries')
            ->value('id');

        $event = Event::query()->updateOrCreate(
            ['name' => 'CLD Youth Conference 2026'],
            [
                'description' => 'CLD Youth Ministries: ONE. For Souls. For Impact',
                'venue' => 'SMX Convention Center, Clark',
                'date_from' => '2026-05-05',
                'date_to' => '2026-05-06',
                'registration_open_at' => Carbon::parse('2026-03-15')->startOfDay(),
                'registration_close_at' => Carbon::parse('2026-04-12')->endOfDay(),
                'total_capacity' => 1200,
                'status' => Event::STATUS_OPEN,
                'scope_type' => Event::SCOPE_DISTRICT,
                'section_id' => null,
                'department_id' => $youthDepartmentId,
            ],
        );

        $desiredFeeCategories = collect([
            [
                'category_name' => 'Regular (Online)',
                'amount' => '800.00',
                'status' => 'active',
            ],
            [
                'category_name' => 'One-day Pass',
                'amount' => '600.00',
                'status' => 'inactive',
            ],
            [
                'category_name' => 'Regular (Onsite)',
                'amount' => '950.00',
                'status' => 'inactive',
            ],
        ]);

        $legacyOnsiteCategory = $event->feeCategories()
            ->where('category_name', 'Onsite')
            ->first();

        if ($legacyOnsiteCategory !== null
            && ! $event->feeCategories()->where('category_name', 'Regular (Onsite)')->exists()) {
            $legacyOnsiteCategory->update([
                'category_name' => 'Regular (Onsite)',
                'amount' => '950.00',
                'slot_limit' => null,
                'status' => 'inactive',
            ]);
        }

        $desiredFeeCategories->each(function (array $feeCategory) use ($event): void {
            $event->feeCategories()->updateOrCreate(
                ['category_name' => $feeCategory['category_name']],
                [
                    'amount' => $feeCategory['amount'],
                    'slot_limit' => null,
                    'status' => $feeCategory['status'],
                ],
            );
        });

        $event->feeCategories()
            ->whereNotIn('category_name', $desiredFeeCategories->pluck('category_name')->all())
            ->whereDoesntHave('registrationItems')
            ->delete();
    }
}
