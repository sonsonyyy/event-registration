<?php

namespace App\Http\Requests;

use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreOnlineRegistrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null || ! $user->can('viewAnyOnline', Registration::class)) {
            return false;
        }

        $pastor = $this->assignedPastor();

        if ($pastor === null) {
            return false;
        }

        return $user->can('createOnline', [Registration::class, $pastor]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'payment_reference' => ['required', 'string', 'max:255'],
            'receipt' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:'.(int) config('registration.receipt_max_kb'),
            ],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'line_items' => ['required', 'array', 'min:1'],
            'line_items.*.fee_category_id' => ['required', 'integer', 'distinct', 'exists:event_fee_categories,id'],
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
                $pastor = $this->assignedPastor();

                if ($pastor === null) {
                    $validator->errors()->add('receipt', 'Your account must be assigned to an active church record before it can register online.');

                    return;
                }

                if ($pastor->status !== 'active') {
                    $validator->errors()->add('receipt', 'Your assigned church account must be active before it can register online.');
                }

                $event = $this->selectedEvent();

                if ($event === null) {
                    return;
                }

                $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');
                $event->syncOperationalStatus();

                if (! $event->canAcceptRegistrations()) {
                    $validator->errors()->add('event_id', 'The selected event is not open for online registration.');
                }

                $lineItems = collect($this->input('line_items', []))
                    ->filter(fn (mixed $lineItem): bool => is_array($lineItem))
                    ->values();

                if ($lineItems->isEmpty()) {
                    return;
                }

                $feeCategories = EventFeeCategory::query()
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

                $totalQuantity = 0;

                $lineItems->each(function (array $lineItem, int $index) use ($feeCategories, $validator, &$totalQuantity): void {
                    $feeCategoryId = (int) ($lineItem['fee_category_id'] ?? 0);
                    $quantity = (int) ($lineItem['quantity'] ?? 0);

                    if ($feeCategoryId === 0 || $quantity === 0) {
                        return;
                    }

                    /** @var EventFeeCategory|null $feeCategory */
                    $feeCategory = $feeCategories->get($feeCategoryId);

                    if ($feeCategory === null) {
                        $validator->errors()->add(
                            "line_items.{$index}.fee_category_id",
                            'Select a valid fee category for the chosen event.',
                        );

                        return;
                    }

                    if ($feeCategory->status !== 'active') {
                        $validator->errors()->add(
                            "line_items.{$index}.fee_category_id",
                            'The selected fee category is not active.',
                        );
                    }

                    $remainingSlots = $feeCategory->remainingSlots();

                    if ($remainingSlots !== null && $quantity > $remainingSlots) {
                        $validator->errors()->add(
                            "line_items.{$index}.quantity",
                            'The selected fee category does not have enough remaining slots.',
                        );
                    }

                    $totalQuantity += $quantity;
                });

                if ($totalQuantity > $event->remainingSlots()) {
                    $validator->errors()->add(
                        'line_items',
                        'The requested quantity exceeds the remaining event capacity.',
                    );
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
            'payment_reference.required' => 'Enter the receipt or reference number.',
            'payment_reference.max' => 'The receipt reference must not exceed 255 characters.',
            'receipt.required' => 'Upload proof of payment.',
            'receipt.file' => 'Upload a valid proof of payment file.',
            'receipt.mimes' => 'Proof of payment must be a JPG, PNG, or PDF file.',
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

    private function assignedPastor(): ?Pastor
    {
        $pastorId = $this->user()?->pastor_id;

        if ($pastorId === null) {
            return null;
        }

        return Pastor::query()->find($pastorId);
    }
}
