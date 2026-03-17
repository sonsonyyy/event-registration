<?php

namespace App\Http\Requests\Admin;

use App\Models\Pastor;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePastorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Pastor::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'section_id' => [
                'required',
                Rule::exists('sections', 'id')
                    ->where(fn ($query) => $query->whereNull('deleted_at')),
            ],
            'pastor_name' => ['required', 'string', 'max:255'],
            'church_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('pastors', 'church_name')->where(
                    fn ($query) => $query
                        ->where('section_id', $this->input('section_id'))
                        ->whereNull('deleted_at'),
                ),
            ],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'regex:/^[^@\s]+@[^@\s]+\.[^@\s]+$/u', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'contact_number' => $this->normalizeOptionalText('contact_number'),
            'email' => $this->normalizeOptionalText('email'),
            'address' => $this->normalizeOptionalText('address'),
        ]);
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'section_id.required' => 'Choose the parent section for this pastor record.',
            'section_id.exists' => 'Choose a valid section.',
            'pastor_name.required' => 'Enter the pastor name.',
            'church_name.required' => 'Enter the church name.',
            'church_name.unique' => 'That church name already exists in the selected section.',
            'email.email' => 'Enter a valid email address.',
            'email.regex' => 'Enter a valid email address.',
            'status.required' => 'Choose a pastor status.',
            'status.in' => 'Choose a valid pastor status.',
        ];
    }

    private function normalizeOptionalText(string $field): ?string
    {
        $value = $this->input($field);

        if ($value === null) {
            return null;
        }

        $normalizedValue = trim((string) $value);

        return $normalizedValue === '' ? null : $normalizedValue;
    }
}
