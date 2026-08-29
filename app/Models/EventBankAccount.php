<?php

namespace App\Models;

use Database\Factories\EventBankAccountFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class EventBankAccount extends Model
{
    /** @use HasFactory<EventBankAccountFactory> */
    use HasFactory, SoftDeletes;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'bank_name',
        'account_name',
        'account_number',
        'qr_code_path',
        'qr_code_original_name',
        'status',
    ];

    protected static function booted(): void
    {
        static::forceDeleted(function (EventBankAccount $bankAccount): void {
            if ($bankAccount->qr_code_path !== null) {
                Storage::disk(self::qrCodeDiskName())->delete($bankAccount->qr_code_path);
            }
        });
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the supported bank account statuses.
     *
     * @return array<int, string>
     */
    public static function statuses(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_INACTIVE,
        ];
    }

    public static function qrCodeDiskName(): string
    {
        return (string) config('registration.bank_qr_code_disk', 'public');
    }

    public function qrCodeUrl(): ?string
    {
        if ($this->qr_code_path === null) {
            return null;
        }

        return route('event-bank-accounts.qr-code', $this, false);
    }
}
