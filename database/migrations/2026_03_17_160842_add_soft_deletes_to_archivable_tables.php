<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('districts', function (Blueprint $table): void {
            if ($this->hasIndex('districts', 'districts_name_unique')) {
                $table->dropUnique('districts_name_unique');
            }

            if (! $this->hasIndex('districts', 'districts_name_index')) {
                $table->index('name');
            }

            if (! Schema::hasColumn('districts', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        if (! $this->hasIndex('sections', 'sections_district_id_foreign_index')) {
            Schema::table('sections', function (Blueprint $table): void {
                $table->index('district_id', 'sections_district_id_foreign_index');
            });
        }

        Schema::table('sections', function (Blueprint $table): void {
            if ($this->hasIndex('sections', 'sections_district_id_name_unique')) {
                $table->dropUnique('sections_district_id_name_unique');
            }

            if (! $this->hasIndex('sections', 'sections_district_id_name_index')) {
                $table->index(['district_id', 'name']);
            }

            if (! Schema::hasColumn('sections', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        if (! $this->hasIndex('pastors', 'pastors_section_id_foreign_index')) {
            Schema::table('pastors', function (Blueprint $table): void {
                $table->index('section_id', 'pastors_section_id_foreign_index');
            });
        }

        Schema::table('pastors', function (Blueprint $table): void {
            if ($this->hasIndex('pastors', 'pastors_section_id_church_name_unique')) {
                $table->dropUnique('pastors_section_id_church_name_unique');
            }

            if (! $this->hasIndex('pastors', 'pastors_section_id_church_name_index')) {
                $table->index(['section_id', 'church_name']);
            }

            if (! Schema::hasColumn('pastors', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('events', function (Blueprint $table): void {
            if (! Schema::hasColumn('events', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        if (! $this->hasIndex('event_fee_categories', 'event_fee_categories_event_id_foreign_index')) {
            Schema::table('event_fee_categories', function (Blueprint $table): void {
                $table->index('event_id', 'event_fee_categories_event_id_foreign_index');
            });
        }

        Schema::table('event_fee_categories', function (Blueprint $table): void {
            if ($this->hasIndex('event_fee_categories', 'event_fee_categories_event_id_category_name_unique')) {
                $table->dropUnique('event_fee_categories_event_id_category_name_unique');
            }

            if (! $this->hasIndex('event_fee_categories', 'event_fee_categories_event_id_category_name_index')) {
                $table->index(['event_id', 'category_name']);
            }

            if (! Schema::hasColumn('event_fee_categories', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            if ($this->hasIndex('users', 'users_email_unique')) {
                $table->dropUnique('users_email_unique');
            }

            if (! $this->hasIndex('users', 'users_email_index')) {
                $table->index('email');
            }

            if (! Schema::hasColumn('users', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'deleted_at')) {
                $table->dropSoftDeletes();
            }

            if ($this->hasIndex('users', 'users_email_index')) {
                $table->dropIndex('users_email_index');
            }

            if (! $this->hasIndex('users', 'users_email_unique')) {
                $table->unique('email');
            }
        });

        Schema::table('event_fee_categories', function (Blueprint $table): void {
            if (Schema::hasColumn('event_fee_categories', 'deleted_at')) {
                $table->dropSoftDeletes();
            }

            if ($this->hasIndex('event_fee_categories', 'event_fee_categories_event_id_category_name_index')) {
                $table->dropIndex('event_fee_categories_event_id_category_name_index');
            }

            if (! $this->hasIndex('event_fee_categories', 'event_fee_categories_event_id_category_name_unique')) {
                $table->unique(['event_id', 'category_name']);
            }
        });

        if ($this->hasIndex('event_fee_categories', 'event_fee_categories_event_id_foreign_index')) {
            Schema::table('event_fee_categories', function (Blueprint $table): void {
                $table->dropIndex('event_fee_categories_event_id_foreign_index');
            });
        }

        Schema::table('events', function (Blueprint $table): void {
            if (Schema::hasColumn('events', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });

        Schema::table('pastors', function (Blueprint $table): void {
            if (Schema::hasColumn('pastors', 'deleted_at')) {
                $table->dropSoftDeletes();
            }

            if ($this->hasIndex('pastors', 'pastors_section_id_church_name_index')) {
                $table->dropIndex('pastors_section_id_church_name_index');
            }

            if (! $this->hasIndex('pastors', 'pastors_section_id_church_name_unique')) {
                $table->unique(['section_id', 'church_name']);
            }
        });

        if ($this->hasIndex('pastors', 'pastors_section_id_foreign_index')) {
            Schema::table('pastors', function (Blueprint $table): void {
                $table->dropIndex('pastors_section_id_foreign_index');
            });
        }

        Schema::table('sections', function (Blueprint $table): void {
            if (Schema::hasColumn('sections', 'deleted_at')) {
                $table->dropSoftDeletes();
            }

            if ($this->hasIndex('sections', 'sections_district_id_name_index')) {
                $table->dropIndex('sections_district_id_name_index');
            }

            if (! $this->hasIndex('sections', 'sections_district_id_name_unique')) {
                $table->unique(['district_id', 'name']);
            }
        });

        if ($this->hasIndex('sections', 'sections_district_id_foreign_index')) {
            Schema::table('sections', function (Blueprint $table): void {
                $table->dropIndex('sections_district_id_foreign_index');
            });
        }

        Schema::table('districts', function (Blueprint $table): void {
            if (Schema::hasColumn('districts', 'deleted_at')) {
                $table->dropSoftDeletes();
            }

            if ($this->hasIndex('districts', 'districts_name_index')) {
                $table->dropIndex('districts_name_index');
            }

            if (! $this->hasIndex('districts', 'districts_name_unique')) {
                $table->unique('name');
            }
        });
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $index): bool => $index['name'] === $indexName);
    }
};
