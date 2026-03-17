<?php

namespace App\Models;

use Database\Factories\SectionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Section extends Model
{
    /** @use HasFactory<SectionFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'district_id',
        'name',
        'description',
        'status',
    ];

    protected static function booted(): void
    {
        static::deleting(function (Section $section): void {
            $section->pastors()
                ->withTrashed()
                ->get()
                ->each(function (Pastor $pastor) use ($section): void {
                    if ($section->isForceDeleting()) {
                        $pastor->forceDelete();

                        return;
                    }

                    if (! $pastor->trashed()) {
                        $pastor->delete();
                    }
                });
        });
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class)->withTrashed();
    }

    public function pastors(): HasMany
    {
        return $this->hasMany(Pastor::class);
    }

    public function assignedUsers(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
