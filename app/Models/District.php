<?php

namespace App\Models;

use Database\Factories\DistrictFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class District extends Model
{
    /** @use HasFactory<DistrictFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'description',
        'status',
    ];

    protected static function booted(): void
    {
        static::deleting(function (District $district): void {
            $district->sections()
                ->withTrashed()
                ->get()
                ->each(function (Section $section) use ($district): void {
                    if ($district->isForceDeleting()) {
                        $section->forceDelete();

                        return;
                    }

                    if (! $section->trashed()) {
                        $section->delete();
                    }
                });
        });
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function assignedUsers(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
