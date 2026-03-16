<?php

namespace App\Http\Requests;

use App\Models\Registration;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
                    Registration::STATUS_NEEDS_CORRECTION,
                    Registration::STATUS_REJECTED,
                ]),
            ],
            'review_reason' => ['nullable', 'string', 'max:1000'],
            'review_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function decision(): string
    {
        return (string) $this->validated('decision');
    }

    public function reviewReason(): ?string
    {
        $reason = $this->validated('review_reason');

        return filled($reason) ? (string) $reason : null;
    }

    public function reviewNotes(): ?string
    {
        $notes = $this->validated('review_notes');

        return filled($notes) ? (string) $notes : null;
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
                $decision = $this->input('decision');

                if (
                    in_array(
                        $decision,
                        [
                            Registration::STATUS_NEEDS_CORRECTION,
                            Registration::STATUS_REJECTED,
                        ],
                        true,
                    )
                    && ! filled($this->input('review_reason'))
                ) {
                    $validator->errors()->add(
                        'review_reason',
                        'Explain why the registration needs correction or is being rejected.',
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
            'decision.required' => 'Choose whether to verify, return for correction, or reject the registration.',
            'decision.in' => 'Choose a valid verification action.',
            'review_reason.max' => 'The review reason must not exceed 1000 characters.',
            'review_notes.max' => 'Reviewer notes must not exceed 1000 characters.',
        ];
    }
}
