<?php

namespace App\Http\Requests;

use App\Models\Registration;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexOnlineRegistrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('viewAnyOnline', Registration::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Get the normalized filter payload.
     *
     * @return array{search: string, per_page: int}
     */
    public function filters(): array
    {
        return [
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
            'search.max' => 'Search terms must be 255 characters or fewer.',
            'per_page.min' => 'Rows per page must be at least 1.',
            'per_page.max' => 'Rows per page may not be greater than 100.',
            'page.min' => 'Choose a valid page number.',
        ];
    }
}
