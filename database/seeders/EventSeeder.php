<?php

namespace Database\Seeders;

use App\Models\Event;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $event = Event::query()->updateOrCreate(
            ['name' => 'CLD Youth Conference 2026'],
            [
                'description' => 'Central Luzon District Youth Ministries Conference 2026',
                'venue' => 'SMX Clark, Pampanga',
                'date_from' => '2026-05-05',
                'date_to' => '2026-05-06',
                'registration_open_at' => now()->startOfDay(),
                'registration_close_at' => now()->addMonth()->endOfDay(),
                'total_capacity' => 2000,
                'status' => Event::STATUS_OPEN,
            ],
        );

        collect([
            [
                'category_name' => 'Regular (Online)',
                'amount' => '800.00',
            ],
            [
                'category_name' => 'Onsite',
                'amount' => '950.00',
            ],
            [
                'category_name' => 'One-day Pass',
                'amount' => '600.00',
            ],
        ])->each(function (array $feeCategory) use ($event): void {
            $event->feeCategories()->updateOrCreate(
                ['category_name' => $feeCategory['category_name']],
                [
                    'amount' => $feeCategory['amount'],
                    'slot_limit' => null,
                    'status' => 'active',
                ],
            );
        });
    }
}
