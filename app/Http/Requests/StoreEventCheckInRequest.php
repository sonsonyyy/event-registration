<?php

namespace App\Http\Requests;

use App\Models\Event;
use App\Models\EventCheckIn;
use App\Models\Pastor;
use App\Models\Section;
use App\Support\DepartmentScopeAccess;
use App\Support\EventCheckInQuantities;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreEventCheckInRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null || ! $user->can('create', [EventCheckIn::class, null])) {
            return false;
        }

        $pastor = $this->selectedPastor();

        if ($pastor === null) {
            return true;
        }

        if (! $user->can('create', [EventCheckIn::class, $pastor])) {
            return false;
        }

        $event = $this->selectedEvent();

        if ($event === null) {
            return true;
        }

        return $user->can('create', [EventCheckIn::class, $pastor, $event]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'event_id' => [
                'required',
                'integer',
                Rule::exists(Event::class, 'id')->whereNull('deleted_at'),
            ],
            'pastor_id' => [
                'required',
                'integer',
                Rule::exists(Pastor::class, 'id')->whereNull('deleted_at'),
            ],
            'representative_name' => ['required', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'line_items' => ['required', 'array', 'min:1'],
            'line_items.*.fee_category_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('event_fee_categories', 'id')->whereNull('deleted_at'),
            ],
            'line_items.*.quantity_claimed' => ['required', 'integer', 'min:0'],
            'line_items.*.remarks' => ['nullable', 'string', 'max:1000'],
            'current_filters.section_id' => [
                'nullable',
                'integer',
                Rule::exists(Section::class, 'id')->whereNull('deleted_at'),
            ],
            'current_filters.search' => ['nullable', 'string', 'max:255'],
            'current_filters.claim_status' => [
                'nullable',
                'string',
                Rule::in([
                    'all',
                    'not claimed',
                    'partially claimed',
                    'fully claimed',
                ]),
            ],
            'current_filters.per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $event = $this->selectedEvent();
                $pastor = $this->selectedPastor();
                $user = $this->user();

                if ($event === null || $pastor === null || $user === null) {
                    return;
                }

                if ($pastor->status !== 'active') {
                    $validator->errors()->add('pastor_id', 'The selected church must be active.');
                }

                if (! DepartmentScopeAccess::canProcessEventCheckIn($user, $pastor, $event)) {
                    $validator->errors()->add(
                        'pastor_id',
                        'The selected church is outside your Event Check-in scope for this event.',
                    );

                    return;
                }

                $positiveLineItems = $this->positiveLineItems();

                if ($positiveLineItems->isEmpty()) {
                    $validator->errors()->add(
                        'line_items',
                        'Enter at least one fee-category quantity to claim.',
                    );

                    return;
                }

                $quantityResolver = app(EventCheckInQuantities::class);
                $feeCategories = $quantityResolver->eventFeeCategories($event);
                $claimableQuantities = $quantityResolver->claimableCategoryQuantities($event, $pastor);

                if ((int) $claimableQuantities->sum() === 0) {
                    $validator->errors()->add(
                        'pastor_id',
                        'The selected church has no claimable registrations for this event.',
                    );

                    return;
                }

                $claimedQuantities = $quantityResolver->claimedCategoryQuantities($event, $pastor);

                foreach ($positiveLineItems as $index => $lineItem) {
                    $feeCategoryId = $lineItem['fee_category_id'];
                    $quantityClaimed = $lineItem['quantity_claimed'];

                    if (! $feeCategories->has($feeCategoryId)) {
                        $validator->errors()->add(
                            "line_items.{$index}.fee_category_id",
                            'Select a valid fee category for the chosen event.',
                        );

                        continue;
                    }

                    $remainingQuantity = max(
                        0,
                        (int) $claimableQuantities->get($feeCategoryId, 0)
                            - (int) $claimedQuantities->get($feeCategoryId, 0),
                    );

                    if ($remainingQuantity === 0) {
                        $validator->errors()->add(
                            "line_items.{$index}.quantity_claimed",
                            'No remaining quantity is available for this fee category.',
                        );

                        continue;
                    }

                    if ($quantityClaimed > $remainingQuantity) {
                        $validator->errors()->add(
                            "line_items.{$index}.quantity_claimed",
                            "Only {$remainingQuantity} remaining quantity is available for this fee category.",
                        );
                    }
                }
            },
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
            'event_id.required' => 'Select an event.',
            'event_id.exists' => 'Select a valid event.',
            'pastor_id.required' => 'Select a church.',
            'pastor_id.exists' => 'Select a valid church.',
            'representative_name.required' => 'Enter the name of the representative claiming the kits.',
            'representative_name.max' => 'The representative name must not exceed 255 characters.',
            'remarks.max' => 'Remarks must not exceed 1000 characters.',
            'line_items.required' => 'Add at least one fee-category row.',
            'line_items.min' => 'Add at least one fee-category row.',
            'line_items.*.fee_category_id.required' => 'Select a fee category.',
            'line_items.*.fee_category_id.distinct' => 'Each fee category can only be claimed once per submission.',
            'line_items.*.fee_category_id.exists' => 'Select a valid fee category.',
            'line_items.*.quantity_claimed.required' => 'Enter a quantity to claim.',
            'line_items.*.quantity_claimed.min' => 'Claimed quantities may not be negative.',
            'line_items.*.remarks.max' => 'Line-item remarks must not exceed 1000 characters.',
            'current_filters.section_id.exists' => 'Choose a valid section filter.',
            'current_filters.search.max' => 'Search terms must be 255 characters or fewer.',
            'current_filters.claim_status.in' => 'Choose a valid claim status filter.',
            'current_filters.per_page.min' => 'Rows per page must be at least 1.',
            'current_filters.per_page.max' => 'Rows per page may not be greater than 100.',
        ];
    }

    /**
     * Get the positive line items being claimed.
     *
     * @return Collection<int, array{fee_category_id: int, quantity_claimed: int, remarks: string|null}>
     */
    public function positiveLineItems(): Collection
    {
        return collect($this->input('line_items', []))
            ->filter(fn (mixed $lineItem): bool => is_array($lineItem))
            ->map(function (array $lineItem): array {
                $remarks = trim((string) ($lineItem['remarks'] ?? ''));

                return [
                    'fee_category_id' => (int) ($lineItem['fee_category_id'] ?? 0),
                    'quantity_claimed' => max(0, (int) ($lineItem['quantity_claimed'] ?? 0)),
                    'remarks' => $remarks !== '' ? $remarks : null,
                ];
            })
            ->filter(fn (array $lineItem): bool => $lineItem['quantity_claimed'] > 0)
            ->values();
    }

    /**
     * Get the filters that should be restored after storing a claim.
     *
     * @return array{event_id: int, section_id?: int, search?: string, claim_status?: string, per_page?: int}
     */
    public function redirectFilters(): array
    {
        $filters = [
            'event_id' => (int) $this->validated('event_id'),
        ];

        if ($this->filled('current_filters.section_id')) {
            $filters['section_id'] = (int) $this->validated('current_filters.section_id');
        }

        $search = trim((string) $this->validated('current_filters.search', ''));

        if ($search !== '') {
            $filters['search'] = $search;
        }

        $claimStatus = (string) $this->validated('current_filters.claim_status', 'all');

        if ($claimStatus !== 'all') {
            $filters['claim_status'] = $claimStatus;
        }

        $perPage = $this->validated('current_filters.per_page');

        if ($perPage !== null) {
            $filters['per_page'] = (int) $perPage;
        }

        return $filters;
    }

    private function selectedEvent(): ?Event
    {
        $eventId = $this->input('event_id');

        if (! filled($eventId)) {
            return null;
        }

        return Event::query()->find($eventId);
    }

    private function selectedPastor(): ?Pastor
    {
        $pastorId = $this->input('pastor_id');

        if (! filled($pastorId)) {
            return null;
        }

        return Pastor::query()
            ->with('section.district')
            ->find($pastorId);
    }
}
