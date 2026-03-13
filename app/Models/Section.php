<?php

namespace App\Models;

use Database\Factories\SectionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Section extends Model
{
    /** @use HasFactory<SectionFactory> */
    use HasFactory;

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

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
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
