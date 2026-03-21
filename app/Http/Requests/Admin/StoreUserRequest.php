<?php

namespace App\Http\Requests\Admin;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\District;
use App\Models\Pastor;
use App\Models\Role;
use App\Models\Section;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreUserRequest extends FormRequest
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', User::class) ?? false;
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
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'district_id' => [
                'nullable',
                'integer',
                Rule::exists('districts', 'id')
                    ->where(fn ($query) => $query->whereNull('deleted_at')),
            ],
            'department_id' => [
                'nullable',
                'integer',
                Rule::exists('departments', 'id')
                    ->where(fn ($query) => $query->whereNull('deleted_at')),
            ],
            'section_id' => [
                'nullable',
                'integer',
                Rule::exists('sections', 'id')
                    ->where(fn ($query) => $query->whereNull('deleted_at')),
            ],
            'pastor_id' => [
                'nullable',
                'integer',
                Rule::exists('pastors', 'id')
                    ->where(fn ($query) => $query->whereNull('deleted_at')),
            ],
            'position_title' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
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
                $role = $this->selectedRole();
                $district = $this->selectedDistrict();
                $section = $this->selectedSection();
                $pastor = $this->selectedPastor();
                $resolvedDistrictId = $pastor?->section->district_id
                    ?? $section?->district_id
                    ?? $district?->getKey();

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

                if ($role?->name === Role::ADMIN && $resolvedDistrictId === null) {
                    $validator->errors()->add(
                        'district_id',
                        'Admins must be assigned to a district.',
                    );
                }

                if ($role?->name === Role::ADMIN && $section !== null) {
                    $validator->errors()->add(
                        'section_id',
                        'Admins must remain district-scoped and cannot be assigned to a section.',
                    );
                }

                if ($role?->name === Role::ADMIN && $pastor !== null) {
                    $validator->errors()->add(
                        'pastor_id',
                        'Admins cannot be assigned to a pastor.',
                    );
                }

                if ($role?->name === Role::MANAGER && $section === null) {
                    $validator->errors()->add(
                        'section_id',
                        'Managers must be assigned to a section.',
                    );
                }

                if ($role?->name === Role::MANAGER && $pastor !== null) {
                    $validator->errors()->add(
                        'pastor_id',
                        'Managers must remain section-scoped and cannot be assigned to a pastor.',
                    );
                }

                if ($role?->name === Role::REGISTRATION_STAFF && $resolvedDistrictId === null) {
                    $validator->errors()->add(
                        'district_id',
                        'Registration staff must be assigned to a district.',
                    );
                }

                if ($role?->name === Role::REGISTRATION_STAFF && $pastor !== null) {
                    $validator->errors()->add(
                        'pastor_id',
                        'Registration staff cannot be assigned to a pastor.',
                    );
                }

                if ($role?->name === Role::ONLINE_REGISTRANT && $pastor === null) {
                    $validator->errors()->add(
                        'pastor_id',
                        'Online registrants must be assigned to a pastor.',
                    );
                }

                $actor = $this->user();

                if ($actor?->isAdmin() && $actor->district_id !== null && $resolvedDistrictId !== null && $resolvedDistrictId !== $actor->district_id) {
                    $validator->errors()->add(
                        'district_id',
                        'You can only manage users inside your assigned district.',
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
            'name.required' => 'Enter the user name.',
            'email.required' => 'Enter the user email address.',
            'email.email' => 'Enter a valid email address.',
            'email.regex' => 'Enter a valid email address.',
            'email.unique' => 'That email address is already in use.',
            'password.required' => 'Enter a password for this user.',
            'password.confirmed' => 'The password confirmation does not match.',
            'role_id.required' => 'Choose a role.',
            'role_id.exists' => 'Choose a valid role.',
            'district_id.exists' => 'Choose a valid district.',
            'department_id.exists' => 'Choose a valid department.',
            'section_id.exists' => 'Choose a valid section.',
            'pastor_id.exists' => 'Choose a valid pastor.',
            'position_title.max' => 'Position titles must be 255 characters or fewer.',
            'status.required' => 'Choose a user status.',
            'status.in' => 'Choose a valid user status.',
        ];
    }

    /**
     * Build the normalized user payload for storage.
     *
     * @return array<string, mixed>
     */
    public function userData(): array
    {
        $validated = $this->validated();
        $district = $this->selectedDistrict();
        $section = $this->selectedSection();
        $pastor = $this->selectedPastor();

        $validated['district_id'] = $district?->getKey();
        $validated['section_id'] = $section?->getKey();
        $validated['pastor_id'] = $pastor?->getKey();

        if ($section !== null) {
            $validated['district_id'] = $section->district_id;
        }

        if ($pastor !== null) {
            $validated['section_id'] = $pastor->section_id;
            $validated['district_id'] = $pastor->section->district_id;
        }

        return $validated;
    }

    private function selectedRole(): ?Role
    {
        $roleId = $this->input('role_id');

        if (! filled($roleId)) {
            return null;
        }

        return Role::query()->find($roleId);
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
}
