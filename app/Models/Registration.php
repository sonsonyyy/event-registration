<?php

namespace App\Models;

use Database\Factories\RegistrationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Registration extends Model
{
    /** @use HasFactory<RegistrationFactory> */
    use HasFactory;

    public const MODE_ONSITE = 'onsite';

    public const MODE_ONLINE = 'online';

    public const PAYMENT_STATUS_PAID = 'paid';

    public const PAYMENT_STATUS_UNPAID = 'unpaid';

    public const PAYMENT_STATUS_PARTIAL = 'partial';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_PENDING_VERIFICATION = 'pending verification';

    public const STATUS_NEEDS_CORRECTION = 'needs correction';

    public const STATUS_VERIFIED = 'verified';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'event_id',
        'pastor_id',
        'encoded_by_user_id',
        'registration_mode',
        'payment_status',
        'registration_status',
        'payment_reference',
        'receipt_file_path',
        'receipt_original_name',
        'receipt_uploaded_at',
        'receipt_uploaded_by_user_id',
        'remarks',
        'submitted_at',
        'verified_at',
        'verified_by_user_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'receipt_uploaded_at' => 'datetime',
            'submitted_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function pastor(): BelongsTo
    {
        return $this->belongsTo(Pastor::class);
    }

    public function encodedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'encoded_by_user_id');
    }

    public function receiptUploadedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receipt_uploaded_by_user_id');
    }

    public function verifiedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RegistrationItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(RegistrationReview::class)
            ->orderByDesc('decided_at')
            ->orderByDesc('id');
    }

    public function latestReview(): HasOne
    {
        return $this->hasOne(RegistrationReview::class)
            ->latestOfMany('decided_at');
    }

    /**
     * Get the supported registration modes.
     *
     * @return array<int, string>
     */
    public static function modes(): array
    {
        return [
            self::MODE_ONSITE,
            self::MODE_ONLINE,
        ];
    }

    /**
     * Get the supported payment statuses.
     *
     * @return array<int, string>
     */
    public static function paymentStatuses(): array
    {
        return [
            self::PAYMENT_STATUS_PAID,
            self::PAYMENT_STATUS_UNPAID,
            self::PAYMENT_STATUS_PARTIAL,
        ];
    }

    /**
     * Get the registration statuses that should reserve event capacity.
     *
     * @return array<int, string>
     */
    public static function capacityReservedStatuses(): array
    {
        return [
            self::STATUS_SUBMITTED,
            self::STATUS_PENDING_VERIFICATION,
            self::STATUS_NEEDS_CORRECTION,
            self::STATUS_VERIFIED,
            self::STATUS_COMPLETED,
        ];
    }

    /**
     * Get the registration statuses used in the receipt verification workflow.
     *
     * @return array<int, string>
     */
    public static function verificationStatuses(): array
    {
        return [
            self::STATUS_PENDING_VERIFICATION,
            self::STATUS_NEEDS_CORRECTION,
            self::STATUS_VERIFIED,
            self::STATUS_REJECTED,
        ];
    }

    /**
     * Get the online statuses that can still be reviewed.
     *
     * @return array<int, string>
     */
    public static function reviewableStatuses(): array
    {
        return [
            self::STATUS_PENDING_VERIFICATION,
            self::STATUS_NEEDS_CORRECTION,
        ];
    }

    /**
     * Get the online statuses that registrants can still correct.
     *
     * @return array<int, string>
     */
    public static function editableOnlineStatuses(): array
    {
        return [
            self::STATUS_PENDING_VERIFICATION,
            self::STATUS_NEEDS_CORRECTION,
        ];
    }

    public function reservesCapacity(): bool
    {
        return in_array($this->registration_status, self::capacityReservedStatuses(), true);
    }

    public function canBeReviewed(): bool
    {
        return $this->registration_mode === self::MODE_ONLINE
            && in_array($this->registration_status, self::reviewableStatuses(), true);
    }

    public function canBeCorrectedOnline(): bool
    {
        return $this->registration_mode === self::MODE_ONLINE
            && in_array($this->registration_status, self::editableOnlineStatuses(), true);
    }

    public function canBeCancelledOnline(): bool
    {
        return $this->canBeCorrectedOnline();
    }

    public function canBeUpdatedOnsite(): bool
    {
        return $this->registration_mode === self::MODE_ONSITE
            && $this->registration_status !== self::STATUS_CANCELLED;
    }

    public function totalQuantity(): int
    {
        if (array_key_exists('total_quantity', $this->attributes)) {
            return (int) $this->attributes['total_quantity'];
        }

        if ($this->relationLoaded('items')) {
            return (int) $this->items->sum('quantity');
        }

        return (int) $this->items()->sum('quantity');
    }

    public function totalAmount(): string
    {
        if (array_key_exists('total_amount', $this->attributes)) {
            return number_format((float) $this->attributes['total_amount'], 2, '.', '');
        }

        if ($this->relationLoaded('items')) {
            return number_format((float) $this->items->sum('subtotal_amount'), 2, '.', '');
        }

        return number_format((float) $this->items()->sum('subtotal_amount'), 2, '.', '');
    }
}
