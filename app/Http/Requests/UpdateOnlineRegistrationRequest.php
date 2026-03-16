<?php

namespace App\Http\Requests;

use App\Models\Registration;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateOnlineRegistrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $registration = $this->route('registration');

        return $registration instanceof Registration
            && ($this->user()?->can('updateOnline', $registration) ?? false);
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
                'nullable',
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
                $registration = $this->route('registration');

                if (! $registration instanceof Registration) {
                    return;
                }

                if (
                    $registration->receipt_file_path === null
                    && ! $this->hasFile('receipt')
                ) {
                    $validator->errors()->add(
                        'receipt',
                        'Upload proof of payment before submitting the registration.',
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
}
