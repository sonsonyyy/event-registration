<?php

namespace App\Models;

use Database\Factories\RoleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    public const SUPER_ADMIN = 'Super Admin';

    /** @use HasFactory<RoleFactory> */
    use HasFactory;

    public const ADMIN = 'Admin';

    public const MANAGER = 'Manager';

    public const REGISTRATION_STAFF = 'Registration Staff';

    public const ONLINE_REGISTRANT = 'Online Registrant';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
