<?php

namespace App\Http\Requests;

use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Support\DepartmentScopeAccess;
use App\Support\EventCapacity;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreOnsiteRegistrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null || ! $user->can('createOnsite', [Registration::class, null])) {
            return false;
        }

        $pastorId = $this->input('pastor_id');

        if (! filled($pastorId)) {
            return true;
        }

        $pastor = Pastor::query()
            ->select(['id', 'section_id'])
            ->find($pastorId);

        if ($pastor === null) {
            return true;
        }

        return $user->can('createOnsite', [Registration::class, $pastor]);
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
                Rule::exists('events', 'id')
                    ->where(fn ($query) => $query->whereNull('deleted_at')),
            ],
            'pastor_id' => [
                'required',
                'integer',
                Rule::exists('pastors', 'id')
                    ->where(fn ($query) => $query->whereNull('deleted_at')),
            ],
            'payment_reference' => ['required', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'line_items' => ['required', 'array', 'min:1'],
            'line_items.*.fee_category_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('event_fee_categories', 'id')
                    ->where(fn ($query) => $query->whereNull('deleted_at')),
            ],
            'line_items.*.quantity' => ['required', 'integer', 'min:1'],
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
                $pastor = $this->selectedPastor();

                if ($pastor !== null && $pastor->status !== 'active') {
                    $validator->errors()->add('pastor_id', 'The selected pastor must be active.');
                }

                $event = $this->selectedEvent();

                if ($event === null) {
                    return;
                }

                $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');
                $event->syncOperationalStatus();

                if (! DepartmentScopeAccess::canAccessEvent($this->user(), $event)) {
                    $validator->errors()->add(
                        'event_id',
                        'The selected event is not available to your account.',
                    );

                    return;
                }

                if (! $event->canAcceptRegistrations()) {
                    $validator->errors()->add('event_id', 'The selected event is not open for onsite registration.');
                }

                $lineItems = collect($this->input('line_items', []))
                    ->filter(fn (mixed $lineItem): bool => is_array($lineItem))
                    ->values();

                if ($lineItems->isEmpty()) {
                    return;
                }

                $feeCategories = $this->selectedFeeCategories($event, $lineItems);
                $capacityErrors = app(EventCapacity::class)->lineItemErrors($event, $feeCategories, $lineItems);

                foreach ($capacityErrors as $field => $message) {
                    $validator->errors()->add($field, $message);
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
            'pastor_id.required' => 'Select a pastor or church.',
            'pastor_id.exists' => 'Select a valid pastor or church.',
            'payment_reference.required' => 'Enter the official receipt or reference number.',
            'payment_reference.max' => 'The receipt or manual reference must not exceed 255 characters.',
            'remarks.max' => 'Remarks must not exceed 1000 characters.',
            'line_items.required' => 'Add at least one fee category item.',
            'line_items.min' => 'Add at least one fee category item.',
            'line_items.*.fee_category_id.required' => 'Select a fee category.',
            'line_items.*.fee_category_id.distinct' => 'Each fee category can only be added once per transaction.',
            'line_items.*.fee_category_id.exists' => 'Select a valid fee category.',
            'line_items.*.quantity.required' => 'Enter a quantity.',
            'line_items.*.quantity.min' => 'Quantities must be at least 1.',
        ];
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

        return Pastor::query()->find($pastorId);
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $lineItems
     * @return Collection<int, EventFeeCategory>
     */
    private function selectedFeeCategories(Event $event, Collection $lineItems): Collection
    {
        return EventFeeCategory::query()
            ->where('event_id', $event->getKey())
            ->whereIn(
                'id',
                $lineItems
                    ->pluck('fee_category_id')
                    ->filter()
                    ->map(fn (mixed $feeCategoryId): int => (int) $feeCategoryId)
                    ->all(),
            )
            ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
            ->get()
            ->keyBy('id');
    }
}
