<?php

namespace App\Http\Requests;

use App\Models\Registration;
use App\Models\Section;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexRegistrationVerificationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('viewAnyVerification', Registration::class) ?? false;
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
            'search' => ['nullable', 'string', 'max:255'],
            'status' => [
                'nullable',
                'string',
                Rule::in([
                    'all',
                    ...Registration::verificationStatuses(),
                ]),
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Get the normalized filter payload.
     *
     * @return array{section_id: int|null, search: string, status: string, per_page: int}
     */
    public function filters(): array
    {
        return [
            'section_id' => $this->filled('section_id')
                ? (int) $this->validated('section_id')
                : null,
            'search' => trim((string) $this->validated('search', '')),
            'status' => (string) $this->validated('status', 'all'),
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
            'section_id.exists' => 'Choose a valid section filter.',
            'search.max' => 'Search terms must be 255 characters or fewer.',
            'status.in' => 'Choose a valid verification status filter.',
            'per_page.min' => 'Rows per page must be at least 1.',
            'per_page.max' => 'Rows per page may not be greater than 100.',
            'page.min' => 'Choose a valid page number.',
        ];
    }
}
