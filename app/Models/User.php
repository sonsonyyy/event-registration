<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'district_id',
        'section_id',
        'pastor_id',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function pastor(): BelongsTo
    {
        return $this->belongsTo(Pastor::class);
    }

    public function encodedRegistrations(): HasMany
    {
        return $this->hasMany(Registration::class, 'encoded_by_user_id');
    }

    public function verifiedRegistrations(): HasMany
    {
        return $this->hasMany(Registration::class, 'verified_by_user_id');
    }

    public function uploadedReceipts(): HasMany
    {
        return $this->hasMany(Registration::class, 'receipt_uploaded_by_user_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function roleName(): ?string
    {
        if ($this->relationLoaded('role')) {
            return $this->role?->name;
        }

        return $this->role()->value('name');
    }

    public function hasRole(string $role): bool
    {
        return $this->roleName() === $role;
    }

    public function hasAnyRole(string ...$roles): bool
    {
        return in_array($this->roleName(), $roles, true);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(Role::ADMIN);
    }

    public function isManager(): bool
    {
        return $this->hasRole(Role::MANAGER);
    }

    public function isRegistrationStaff(): bool
    {
        return $this->hasRole(Role::REGISTRATION_STAFF);
    }

    public function isOnlineRegistrant(): bool
    {
        return $this->hasRole(Role::ONLINE_REGISTRANT);
    }

    public function managesSection(int $sectionId): bool
    {
        return $this->isManager() && $this->section_id !== null && $this->section_id === $sectionId;
    }

    public function belongsToPastor(int $pastorId): bool
    {
        return $this->isOnlineRegistrant() && $this->pastor_id !== null && $this->pastor_id === $pastorId;
    }

    public function canAccessSection(Section $section): bool
    {
        return $this->isAdmin() || $this->managesSection($section->getKey());
    }

    public function canAccessPastor(Pastor $pastor): bool
    {
        if ($this->isAdmin() || $this->isRegistrationStaff()) {
            return true;
        }

        if ($this->isManager()) {
            return $this->managesSection($pastor->section_id);
        }

        return $this->belongsToPastor($pastor->getKey());
    }

    public function canAccessRegistration(Registration $registration): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if ($this->isManager()) {
            return $this->managesSection($registration->pastor->section_id);
        }

        if ($this->isRegistrationStaff()) {
            return $registration->encoded_by_user_id === $this->getKey();
        }

        return $this->belongsToPastor($registration->pastor_id);
    }
}
