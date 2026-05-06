<?php

namespace App\Models;

use Database\Factories\RegistrationHistoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationHistory extends Model
{
    /** @use HasFactory<RegistrationHistoryFactory> */
    use HasFactory;

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'registration_id',
        'altered_by_user_id',
        'snapshot',
        'altered_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'altered_at' => 'datetime',
        ];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class)->withTrashed();
    }

    public function alteredByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'altered_by_user_id')->withTrashed();
    }
}
