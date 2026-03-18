<?php

namespace App\Http\Requests;

use App\Models\Event;
use App\Models\Pastor;
use App\Models\Registration;
use App\Support\DepartmentScopeAccess;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateOnsiteRegistrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $registration = $this->route('registration');

        return $registration instanceof Registration
            && ($this->user()?->can('updateOnsite', $registration) ?? false);
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
                $event = $this->selectedEvent();

                if ($event !== null && ! DepartmentScopeAccess::canAccessEvent($this->user(), $event)) {
                    $validator->errors()->add(
                        'event_id',
                        'The selected event is not available to your account.',
                    );
                }

                $pastor = $this->selectedPastor();

                if ($pastor !== null && $pastor->status !== 'active') {
                    $validator->errors()->add(
                        'pastor_id',
                        'The selected pastor must be active.',
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
}
