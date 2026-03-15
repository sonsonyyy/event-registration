<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('viewReports') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'section_id' => ['nullable', 'integer', 'exists:sections,id'],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Get the normalized filter payload.
     *
     * @return array{event_id: int|null, section_id: int|null, search: string, per_page: int}
     */
    public function filters(): array
    {
        $eventId = $this->validated('event_id');
        $sectionId = $this->validated('section_id');
        $search = $this->validated('search', '');
        $perPage = $this->validated('per_page', 10);

        return [
            'event_id' => $eventId !== null ? (int) $eventId : null,
            'section_id' => $sectionId !== null ? (int) $sectionId : null,
            'search' => trim((string) $search),
            'per_page' => (int) $perPage,
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
            'event_id.exists' => 'Choose a valid event for reporting.',
            'section_id.exists' => 'Choose a valid section for reporting.',
            'search.max' => 'Search terms must be 255 characters or fewer.',
            'per_page.min' => 'Rows per page must be at least 1.',
            'per_page.max' => 'Rows per page may not be greater than 100.',
            'page.min' => 'Choose a valid page number.',
        ];
    }
}
