<?php

namespace App\Http\Requests;

use App\Models\User;
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
            'tab' => ['nullable', 'string', 'in:section-summary,church-summary,no-registration'],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'collection_date_from' => ['nullable', 'date'],
            'collection_date_to' => ['nullable', 'date', 'after_or_equal:collection_date_from'],
            'collection_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'collection_generated' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get the normalized filter payload.
     *
     * @return array{
     *     event_id: int|null,
     *     section_id: int|null,
     *     tab: string,
     *     search: string,
     *     per_page: int
     * }
     */
    public function filters(): array
    {
        $eventId = $this->validated('event_id');
        $sectionId = $this->validated('section_id');
        $search = $this->validated('search', '');
        $perPage = $this->validated('per_page', 10);
        $normalizedSearch = trim((string) $search);
        $defaultTab = $normalizedSearch !== '' ? 'no-registration' : 'section-summary';

        return [
            'event_id' => $eventId !== null ? (int) $eventId : null,
            'section_id' => $sectionId !== null ? (int) $sectionId : null,
            'tab' => (string) $this->validated('tab', $defaultTab),
            'search' => $normalizedSearch,
            'per_page' => (int) $perPage,
        ];
    }

    /**
     * Get the normalized onsite collection report filters.
     *
     * @return array{
     *     date_from: string,
     *     date_to: string,
     *     user_id: int|null,
     *     generated: bool
     * }
     */
    public function onsiteCollectionFilters(): array
    {
        $user = $this->user();
        $collectorId = $this->validated('collection_user_id');

        if ($user instanceof User && $user->isManager()) {
            $collectorId = $user->getKey();
        }

        return [
            'date_from' => (string) $this->validated('collection_date_from', ''),
            'date_to' => (string) $this->validated('collection_date_to', ''),
            'user_id' => $collectorId !== null ? (int) $collectorId : null,
            'generated' => $this->boolean('collection_generated'),
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
            'tab.in' => 'Choose a valid report tab.',
            'search.max' => 'Search terms must be 255 characters or fewer.',
            'per_page.min' => 'Rows per page must be at least 1.',
            'per_page.max' => 'Rows per page may not be greater than 100.',
            'page.min' => 'Choose a valid page number.',
            'collection_date_from.date' => 'Choose a valid collection start date.',
            'collection_date_to.date' => 'Choose a valid collection end date.',
            'collection_date_to.after_or_equal' => 'The collection end date must be on or after the start date.',
            'collection_user_id.exists' => 'Choose a valid collecting user.',
        ];
    }
}
