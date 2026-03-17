<?php

namespace App\Models;

use Database\Factories\PastorFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pastor extends Model
{
    /** @use HasFactory<PastorFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'section_id',
        'pastor_name',
        'church_name',
        'contact_number',
        'email',
        'address',
        'status',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class)->withTrashed();
    }

    public function assignedUsers(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }
}
