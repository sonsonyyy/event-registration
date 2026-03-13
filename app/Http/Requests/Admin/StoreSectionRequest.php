<?php

namespace App\Http\Requests\Admin;

use App\Models\Section;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Section::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'district_id' => ['required', 'exists:districts,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('sections', 'name')->where(fn ($query) => $query->where('district_id', $this->input('district_id'))),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
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
            'district_id.required' => 'Choose the parent district for this section.',
            'district_id.exists' => 'Choose a valid district.',
            'name.required' => 'Enter a section name.',
            'name.unique' => 'That section name already exists in the selected district.',
            'status.required' => 'Choose a section status.',
            'status.in' => 'Choose a valid section status.',
        ];
    }
}
