<?php

namespace App\Models;

use Database\Factories\EventCheckInItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventCheckInItem extends Model
{
    /** @use HasFactory<EventCheckInItemFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'event_check_in_id',
        'fee_category_id',
        'quantity_claimed',
        'remarks',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity_claimed' => 'integer',
        ];
    }

    public function eventCheckIn(): BelongsTo
    {
        return $this->belongsTo(EventCheckIn::class);
    }

    public function feeCategory(): BelongsTo
    {
        return $this->belongsTo(EventFeeCategory::class, 'fee_category_id')->withTrashed();
    }
}
