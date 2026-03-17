<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\EventFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    /** @use HasFactory<EventFactory> */
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const SCOPE_DISTRICT = 'district';

    public const SCOPE_SECTION = 'section';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'description',
        'date_from',
        'date_to',
        'venue',
        'registration_open_at',
        'registration_close_at',
        'total_capacity',
        'status',
        'scope_type',
        'section_id',
        'department_id',
    ];

    protected static function booted(): void
    {
        static::deleting(function (Event $event): void {
            $event->feeCategories()
                ->withTrashed()
                ->get()
                ->each(function (EventFeeCategory $feeCategory) use ($event): void {
                    if ($event->isForceDeleting()) {
                        $feeCategory->forceDelete();

                        return;
                    }

                    if (! $feeCategory->trashed()) {
                        $feeCategory->delete();
                    }
                });
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_from' => 'date',
            'date_to' => 'date',
            'registration_open_at' => 'datetime',
            'registration_close_at' => 'datetime',
            'total_capacity' => 'integer',
        ];
    }

    public function feeCategories(): HasMany
    {
        return $this->hasMany(EventFeeCategory::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class)->withTrashed();
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class)->withTrashed();
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function registrationItems(): HasManyThrough
    {
        return $this->hasManyThrough(
            RegistrationItem::class,
            Registration::class,
            'event_id',
            'registration_id',
        );
    }

    public function reservedRegistrationItems(): HasManyThrough
    {
        return $this->registrationItems()->whereIn(
            'registrations.registration_status',
            Registration::capacityReservedStatuses(),
        );
    }

    public function scopeWithCapacityMetrics(Builder $query): void
    {
        $query
            ->withCount('feeCategories')
            ->withCount('registrations')
            ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity');
    }

    /**
     * Get the supported event statuses.
     *
     * @return array<int, string>
     */
    public static function statuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_OPEN,
            self::STATUS_CLOSED,
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED,
        ];
    }

    /**
     * Get the supported event scope types.
     *
     * @return array<int, string>
     */
    public static function scopeTypes(): array
    {
        return [
            self::SCOPE_DISTRICT,
            self::SCOPE_SECTION,
        ];
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

    public function remainingSlots(): int
    {
        return max($this->total_capacity - $this->reservedQuantity(), 0);
    }

    public function isFull(): bool
    {
        return $this->remainingSlots() === 0;
    }

    public function registrationWindowIsOpen(?CarbonInterface $now = null): bool
    {
        $now ??= now();

        return $this->registration_open_at->lte($now)
            && $this->registration_close_at->gt($now);
    }

    public function resolvedStatus(?CarbonInterface $now = null): string
    {
        $now ??= now();

        if ($this->status !== self::STATUS_OPEN) {
            return $this->status;
        }

        if ($this->isFull() || $this->registration_close_at->lte($now)) {
            return self::STATUS_CLOSED;
        }

        return self::STATUS_OPEN;
    }

    public function statusReason(?CarbonInterface $now = null): ?string
    {
        $now ??= now();

        if ($this->isFull()) {
            return 'Capacity reached';
        }

        if (
            in_array($this->status, [self::STATUS_OPEN, self::STATUS_CLOSED], true)
            && $this->registration_close_at->lte($now)
        ) {
            return 'Registration window ended';
        }

        if ($this->status === self::STATUS_OPEN && ! $this->registrationWindowIsOpen($now)) {
            return 'Registration has not opened yet';
        }

        return null;
    }

    public function canAcceptRegistrations(?CarbonInterface $now = null): bool
    {
        return $this->resolvedStatus($now) === self::STATUS_OPEN
            && $this->registrationWindowIsOpen($now)
            && ! $this->isFull();
    }

    public function syncOperationalStatus(?CarbonInterface $now = null): bool
    {
        $resolvedStatus = $this->resolvedStatus($now);

        if ($resolvedStatus === $this->status) {
            return false;
        }

        if ($this->status === self::STATUS_OPEN && $resolvedStatus === self::STATUS_CLOSED) {
            $this->forceFill([
                'status' => $resolvedStatus,
            ])->saveQuietly();

            return true;
        }

        return false;
    }
}
