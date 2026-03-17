<?php

namespace App\Models;

use Database\Factories\RegistrationItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationItem extends Model
{
    /** @use HasFactory<RegistrationItemFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'registration_id',
        'fee_category_id',
        'quantity',
        'unit_amount',
        'subtotal_amount',
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
            'unit_amount' => 'decimal:2',
            'subtotal_amount' => 'decimal:2',
        ];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function feeCategory(): BelongsTo
    {
        return $this->belongsTo(EventFeeCategory::class, 'fee_category_id')->withTrashed();
    }
}
