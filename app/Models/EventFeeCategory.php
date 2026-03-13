<?php

namespace App\Models;

use Database\Factories\EventFeeCategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventFeeCategory extends Model
{
    /** @use HasFactory<EventFeeCategoryFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'event_id',
        'category_name',
        'amount',
        'slot_limit',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'slot_limit' => 'integer',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function registrationItems(): HasMany
    {
        return $this->hasMany(RegistrationItem::class, 'fee_category_id');
    }

    public function reservedRegistrationItems(): HasMany
    {
        return $this->registrationItems()->whereHas('registration', function ($query): void {
            $query->whereIn('registration_status', Registration::capacityReservedStatuses());
        });
    }

    public function reservedQuantity(): int
    {
        if (array_key_exists('reserved_quantity', $this->attributes)) {
            return (int) $this->attributes['reserved_quantity'];
        }

        if ($this->relationLoaded('reservedRegistrationItems')) {
            return (int) $this->reservedRegistrationItems->sum('quantity');
        }

        return (int) $this->reservedRegistrationItems()->sum('quantity');
    }

    public function remainingSlots(): ?int
    {
        if ($this->slot_limit === null) {
            return null;
        }

        return max($this->slot_limit - $this->reservedQuantity(), 0);
    }
}
