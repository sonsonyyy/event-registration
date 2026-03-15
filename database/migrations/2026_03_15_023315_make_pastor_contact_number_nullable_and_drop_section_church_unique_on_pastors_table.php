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
        if (! $this->hasIndex('pastors', 'pastors_section_id_index')) {
            Schema::table('pastors', function (Blueprint $table) {
                $table->index('section_id');
            });
        }

        if ($this->hasIndex('pastors', 'pastors_section_id_church_name_unique')) {
            Schema::table('pastors', function (Blueprint $table) {
                $table->dropUnique('pastors_section_id_church_name_unique');
            });
        }

        Schema::table('pastors', function (Blueprint $table) {
            $table->string('contact_number')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('pastors')
            ->whereNull('contact_number')
            ->update([
                'contact_number' => '',
            ]);

        Schema::table('pastors', function (Blueprint $table) {
            $table->string('contact_number')->nullable(false)->change();
        });

        $hasDuplicateChurchNames = DB::table('pastors')
            ->select('section_id', 'church_name')
            ->groupBy('section_id', 'church_name')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if (! $hasDuplicateChurchNames) {
            Schema::table('pastors', function (Blueprint $table) {
                $table->unique(['section_id', 'church_name']);
            });

            if ($this->hasIndex('pastors', 'pastors_section_id_index')) {
                Schema::table('pastors', function (Blueprint $table) {
                    $table->dropIndex('pastors_section_id_index');
                });
            }
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $index): bool => $index['name'] === $indexName);
    }
};
