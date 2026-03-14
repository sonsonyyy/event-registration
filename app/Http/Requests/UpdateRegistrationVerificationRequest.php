<?php

namespace App\Http\Requests;

use App\Models\Registration;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRegistrationVerificationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $registration = $this->route('registration');

        return $registration instanceof Registration
            && ($this->user()?->can('verifyReceipt', $registration) ?? false);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'decision' => [
                'required',
                'string',
                Rule::in([
                    Registration::STATUS_VERIFIED,
                    Registration::STATUS_REJECTED,
                ]),
            ],
        ];
    }

    public function decision(): string
    {
        return (string) $this->validated('decision');
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'decision.required' => 'Choose whether to verify or reject the registration.',
            'decision.in' => 'Choose a valid verification action.',
        ];
    }
}
