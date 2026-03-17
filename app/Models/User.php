<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\DepartmentScopeAccess;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const APPROVAL_PENDING = 'pending';

    public const APPROVAL_APPROVED = 'approved';

    public const APPROVAL_REJECTED = 'rejected';

    public const ACCOUNT_SOURCE_ADMIN = 'admin';

    public const ACCOUNT_SOURCE_SELF_SERVICE = 'self_service';

    public const MAX_REGISTRANT_ACCOUNTS_PER_PASTOR = 2;

    public const REGISTRANT_OCCUPYING_APPROVAL_STATUSES = [
        self::APPROVAL_PENDING,
        self::APPROVAL_APPROVED,
    ];

    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

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
        'department_id',
        'pastor_id',
        'position_title',
        'status',
        'approval_status',
        'account_source',
        'approval_reviewed_by_user_id',
        'approval_reviewed_at',
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
            'approval_reviewed_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class)->withTrashed();
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class)->withTrashed();
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class)->withTrashed();
    }

    public function pastor(): BelongsTo
    {
        return $this->belongsTo(Pastor::class)->withTrashed();
    }

    public function approvalReviewer(): BelongsTo
    {
        return $this->belongsTo(self::class, 'approval_reviewed_by_user_id')->withTrashed();
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

    public function registrationReviews(): HasMany
    {
        return $this->hasMany(RegistrationReview::class, 'reviewer_user_id');
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
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

    public function hasAdminAccess(): bool
    {
        return $this->isAdmin() || $this->isSuperAdmin();
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(Role::SUPER_ADMIN);
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

    public function isApprovalPending(): bool
    {
        return $this->approval_status === self::APPROVAL_PENDING;
    }

    public function isApprovalApproved(): bool
    {
        return $this->approval_status === self::APPROVAL_APPROVED;
    }

    public function isApprovalRejected(): bool
    {
        return $this->approval_status === self::APPROVAL_REJECTED;
    }

    public function isSelfServiceAccount(): bool
    {
        return $this->account_source === self::ACCOUNT_SOURCE_SELF_SERVICE;
    }

    public function isDepartmentScoped(): bool
    {
        return $this->department_id !== null;
    }

    public function hasGeneralDepartmentScope(): bool
    {
        return $this->department_id === null;
    }

    public function hasApprovedOnlineRegistrationAccess(): bool
    {
        return $this->isOnlineRegistrant()
            && $this->pastor !== null
            && ! $this->pastor->trashed()
            && $this->isApprovalApproved();
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
        return $this->hasAdminAccess() || $this->managesSection($section->getKey());
    }

    public function canAccessPastor(Pastor $pastor): bool
    {
        if ($this->hasAdminAccess() || $this->isRegistrationStaff()) {
            return true;
        }

        if ($this->isManager()) {
            return $this->managesSection($pastor->section_id);
        }

        return $this->belongsToPastor($pastor->getKey());
    }

    public function canAccessRegistration(Registration $registration): bool
    {
        if ($this->hasAdminAccess()) {
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

    public function canViewRegistrantApprovalQueue(): bool
    {
        return DepartmentScopeAccess::canViewApprovalQueue($this);
    }

    public function canApproveRegistrantRequest(User $accountRequest): bool
    {
        return DepartmentScopeAccess::canApproveRegistrantRequest($this, $accountRequest);
    }

    public function canViewVerificationQueue(): bool
    {
        return DepartmentScopeAccess::canViewVerificationQueue($this);
    }

    public function canAccessVerificationRegistration(Registration $registration): bool
    {
        return DepartmentScopeAccess::canAccessVerificationRegistration($this, $registration);
    }

    public function canReviewRegistration(Registration $registration): bool
    {
        return DepartmentScopeAccess::canReviewRegistration($this, $registration);
    }

    /**
     * Get the supported approval status values.
     *
     * @return array<int, string>
     */
    public static function approvalStatuses(): array
    {
        return [
            self::APPROVAL_PENDING,
            self::APPROVAL_APPROVED,
            self::APPROVAL_REJECTED,
        ];
    }
}
