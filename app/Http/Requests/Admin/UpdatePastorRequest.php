<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePastorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('pastor')) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'section_id' => ['required', 'exists:sections,id'],
            'pastor_name' => ['required', 'string', 'max:255'],
            'church_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('pastors', 'church_name')
                    ->where(fn ($query) => $query->where('section_id', $this->input('section_id')))
                    ->ignore($this->route('pastor')),
            ],
            'contact_number' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
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
            'section_id.required' => 'Choose the parent section for this pastor record.',
            'section_id.exists' => 'Choose a valid section.',
            'pastor_name.required' => 'Enter the pastor name.',
            'church_name.required' => 'Enter the church name.',
            'church_name.unique' => 'That church name already exists in the selected section.',
            'contact_number.required' => 'Enter a contact number.',
            'email.email' => 'Enter a valid email address.',
            'status.required' => 'Choose a pastor status.',
            'status.in' => 'Choose a valid pastor status.',
        ];
    }
}
