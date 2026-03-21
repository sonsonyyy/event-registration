<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->foreignId('district_id')
                ->nullable()
                ->after('scope_type')
                ->constrained()
                ->nullOnDelete();
        });

        DB::table('events')
            ->select('id', 'section_id')
            ->whereNotNull('section_id')
            ->orderBy('id')
            ->lazyById()
            ->each(function (object $event): void {
                $districtId = DB::table('sections')
                    ->where('id', $event->section_id)
                    ->value('district_id');

                if ($districtId === null) {
                    return;
                }

                DB::table('events')
                    ->where('id', $event->id)
                    ->update(['district_id' => $districtId]);
            });

        if (DB::table('districts')->count() === 1) {
            $districtId = DB::table('districts')->value('id');

            DB::table('events')
                ->whereNull('district_id')
                ->update(['district_id' => $districtId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('district_id');
        });
    }
};
