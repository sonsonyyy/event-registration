<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'name' => $this->nameRules(),
            'email' => $this->emailRules($userId),
        ];
    }

    /**
     * Get the validation rules used to validate user names.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        $uniqueEmailRule = Rule::unique(User::class, 'email')
            ->where(fn ($query) => $query->whereNull('deleted_at'));

        if ($userId !== null) {
            $uniqueEmailRule->ignore($userId);
        }

        return [
            'required',
            'string',
            'email',
            'regex:/^[^@\s]+@[^@\s]+\.[^@\s]+$/u',
            'max:255',
            $uniqueEmailRule,
        ];
    }
}
