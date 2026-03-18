<?php

namespace App\Models;

use App\Support\EventCapacity;
use Database\Factories\EventFeeCategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EventFeeCategory extends Model
{
    /** @use HasFactory<EventFeeCategoryFactory> */
    use HasFactory, SoftDeletes;

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
        return $this->belongsTo(Event::class)->withTrashed();
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
        return app(EventCapacity::class)->reservedQuantityForFeeCategory($this);
    }

    public function remainingSlots(): ?int
    {
        return app(EventCapacity::class)->remainingSlotsForFeeCategory($this);
    }
}
