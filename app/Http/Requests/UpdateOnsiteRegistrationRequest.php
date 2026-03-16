<?php

namespace App\Http\Requests;

use App\Models\Registration;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'pastor_id' => ['required', 'integer', 'exists:pastors,id'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'line_items' => ['required', 'array', 'min:1'],
            'line_items.*.fee_category_id' => ['required', 'integer', 'distinct', 'exists:event_fee_categories,id'],
            'line_items.*.quantity' => ['required', 'integer', 'min:1'],
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
}
