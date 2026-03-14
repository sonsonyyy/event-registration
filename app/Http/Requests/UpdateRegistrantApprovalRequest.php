<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRegistrantApprovalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->route('user');

        return $user instanceof User
            && ($this->user()?->can('reviewRegistrantRequest', $user) ?? false);
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
                    User::APPROVAL_APPROVED,
                    User::APPROVAL_REJECTED,
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
            'decision.required' => 'Choose whether to approve or reject this account request.',
            'decision.in' => 'Choose a valid account approval action.',
        ];
    }
}
