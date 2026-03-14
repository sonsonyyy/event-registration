<?php

namespace App\Http\Requests;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreRegistrantAccessRequest extends FormRequest
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() === null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'district_id' => ['required', 'integer', 'exists:districts,id'],
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'pastor_id' => ['required', 'integer', 'exists:pastors,id'],
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
                $district = $this->selectedDistrict();
                $section = $this->selectedSection();
                $pastor = $this->selectedPastor();

                if ($district !== null && $district->status !== 'active') {
                    $validator->errors()->add(
                        'district_id',
                        'The selected district is not available for registrant access requests.',
                    );
                }

                if ($section !== null && $section->status !== 'active') {
                    $validator->errors()->add(
                        'section_id',
                        'The selected section is not available for registrant access requests.',
                    );
                }

                if ($pastor !== null && $pastor->status !== 'active') {
                    $validator->errors()->add(
                        'pastor_id',
                        'The selected pastor or church is not available for registrant access requests.',
                    );
                }

                if ($section !== null && $district !== null && $section->district_id !== $district->getKey()) {
                    $validator->errors()->add(
                        'section_id',
                        'The selected section does not belong to the chosen district.',
                    );
                }

                if ($pastor !== null && $section !== null && $pastor->section_id !== $section->getKey()) {
                    $validator->errors()->add(
                        'pastor_id',
                        'The selected pastor does not belong to the chosen section.',
                    );
                }

                if (
                    $pastor !== null
                    && $district !== null
                    && $pastor->section->district_id !== $district->getKey()
                ) {
                    $validator->errors()->add(
                        'pastor_id',
                        'The selected pastor does not belong to the chosen district.',
                    );
                }

                if ($pastor !== null && $this->pastorAlreadyHasRegistrantAccess($pastor)) {
                    $validator->errors()->add(
                        'pastor_id',
                        'A registrant account for this church already exists or is currently pending approval.',
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
            'name.required' => 'Enter the representative full name.',
            'email.required' => 'Enter the email address that will be used to log in.',
            'email.email' => 'Enter a valid email address.',
            'email.unique' => 'That email address is already in use.',
            'password.required' => 'Enter a password for this registrant account.',
            'password.confirmed' => 'The password confirmation does not match.',
            'district_id.required' => 'Choose a district.',
            'district_id.exists' => 'Choose a valid district.',
            'section_id.required' => 'Choose a section.',
            'section_id.exists' => 'Choose a valid section.',
            'pastor_id.required' => 'Choose the church or pastor this account will represent.',
            'pastor_id.exists' => 'Choose a valid church or pastor record.',
        ];
    }

    /**
     * Build the normalized user payload for a self-service registrant request.
     *
     * @return array<string, mixed>
     */
    public function requestedUserData(): array
    {
        $validated = $this->validated();
        $pastor = $this->selectedPastor();

        return [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'district_id' => $pastor?->section->district_id,
            'section_id' => $pastor?->section_id,
            'pastor_id' => $pastor?->getKey(),
        ];
    }

    private function selectedDistrict(): ?District
    {
        $districtId = $this->input('district_id');

        if (! filled($districtId)) {
            return null;
        }

        return District::query()->find($districtId);
    }

    private function selectedSection(): ?Section
    {
        $sectionId = $this->input('section_id');

        if (! filled($sectionId)) {
            return null;
        }

        return Section::query()->find($sectionId);
    }

    private function selectedPastor(): ?Pastor
    {
        $pastorId = $this->input('pastor_id');

        if (! filled($pastorId)) {
            return null;
        }

        return Pastor::query()
            ->with('section:id,district_id')
            ->find($pastorId);
    }

    private function pastorAlreadyHasRegistrantAccess(Pastor $pastor): bool
    {
        return User::query()
            ->where('pastor_id', $pastor->getKey())
            ->where('status', User::STATUS_ACTIVE)
            ->whereIn('approval_status', [
                User::APPROVAL_PENDING,
                User::APPROVAL_APPROVED,
            ])
            ->whereHas('role', function ($query): void {
                $query->where('name', Role::ONLINE_REGISTRANT);
            })
            ->exists();
    }
}
