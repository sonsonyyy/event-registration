<?php

namespace App\Http\Requests\Admin;

use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', User::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'section_id' => [
                'nullable',
                'integer',
                Rule::exists(Section::class, 'id')->whereNull('deleted_at'),
            ],
            'role_id' => ['nullable', 'integer', Rule::exists(Role::class, 'id')],
            'status' => [
                'nullable',
                'string',
                Rule::in([
                    User::STATUS_ACTIVE,
                    User::STATUS_INACTIVE,
                ]),
            ],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Get the normalized filter payload.
     *
     * @return array{section_id: int|null, role_id: int|null, status: string|null, search: string, per_page: int}
     */
    public function filters(): array
    {
        return [
            'section_id' => $this->filled('section_id')
                ? (int) $this->validated('section_id')
                : null,
            'role_id' => $this->filled('role_id')
                ? (int) $this->validated('role_id')
                : null,
            'status' => $this->filled('status')
                ? (string) $this->validated('status')
                : null,
            'search' => trim((string) $this->validated('search', '')),
            'per_page' => (int) $this->validated('per_page', 10),
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'section_id.exists' => 'Choose a valid section.',
            'role_id.exists' => 'Choose a valid role.',
            'status.in' => 'Choose a valid status.',
            'search.max' => 'Search terms must be 255 characters or fewer.',
            'per_page.min' => 'Rows per page must be at least 1.',
            'per_page.max' => 'Rows per page may not be greater than 100.',
            'page.min' => 'Choose a valid page number.',
        ];
    }
}
