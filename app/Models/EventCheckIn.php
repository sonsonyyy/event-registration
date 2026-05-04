<?php

namespace App\Models;

use Database\Factories\EventCheckInFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventCheckIn extends Model
{
    /** @use HasFactory<EventCheckInFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'event_id',
        'pastor_id',
        'checked_in_by_user_id',
        'representative_name',
        'total_claimed_quantity',
        'remarks',
        'checked_in_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_claimed_quantity' => 'integer',
            'checked_in_at' => 'datetime',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class)->withTrashed();
    }

    public function pastor(): BelongsTo
    {
        return $this->belongsTo(Pastor::class)->withTrashed();
    }

    public function checkedInByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by_user_id')->withTrashed();
    }

    public function items(): HasMany
    {
        return $this->hasMany(EventCheckInItem::class)
            ->orderBy('fee_category_id')
            ->orderBy('id');
    }
}
