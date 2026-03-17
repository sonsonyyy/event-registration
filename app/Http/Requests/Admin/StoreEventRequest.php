<?php

namespace App\Http\Requests\Admin;

use App\Models\Department;
use App\Models\Event;
use App\Models\Section;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreEventRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Event::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'venue' => ['required', 'string', 'max:255'],
            'registration_open_at' => ['required', 'date'],
            'registration_close_at' => ['required', 'date', 'after:registration_open_at'],
            'total_capacity' => ['required', 'integer', 'min:1'],
            'status' => ['required', Rule::in(Event::statuses())],
            'scope_type' => ['required', Rule::in(Event::scopeTypes())],
            'section_id' => [
                'nullable',
                'integer',
                Rule::exists(Section::class, 'id')->whereNull('deleted_at'),
            ],
            'department_id' => [
                'nullable',
                'integer',
                Rule::exists(Department::class, 'id')->whereNull('deleted_at'),
            ],
            'fee_categories' => ['required', 'array', 'min:1'],
            'fee_categories.*.category_name' => ['required', 'string', 'max:255'],
            'fee_categories.*.amount' => ['required', 'numeric', 'min:0.01'],
            'fee_categories.*.slot_limit' => ['nullable', 'integer', 'min:1'],
            'fee_categories.*.status' => ['required', Rule::in(['active', 'inactive'])],
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
                $feeCategories = collect($this->input('fee_categories', []));
                $normalizedNames = $feeCategories
                    ->pluck('category_name')
                    ->map(fn (mixed $name): string => mb_strtolower(trim((string) $name)))
                    ->filter();

                if ($normalizedNames->duplicates()->isNotEmpty()) {
                    $validator->errors()->add('fee_categories', 'Fee category names must be unique per event.');
                }

                if ($this->input('scope_type') === Event::SCOPE_SECTION && ! $this->filled('section_id')) {
                    $validator->errors()->add('section_id', 'Choose the section that owns this sectional event.');
                }

                if ($this->input('scope_type') === Event::SCOPE_DISTRICT && $this->filled('section_id')) {
                    $validator->errors()->add('section_id', 'District-wide events cannot be assigned to a section.');
                }

                $totalCapacity = (int) $this->input('total_capacity', 0);
                $slotLimitTotal = $feeCategories->sum(fn (array $category): int => (int) ($category['slot_limit'] ?? 0));

                if ($slotLimitTotal > $totalCapacity) {
                    $validator->errors()->add('fee_categories', 'Combined fee category slot limits cannot exceed the event capacity.');
                }

                $feeCategories->each(function (array $category, int $index) use ($totalCapacity, $validator): void {
                    $slotLimit = $category['slot_limit'] ?? null;

                    if ($slotLimit !== null && (int) $slotLimit > $totalCapacity) {
                        $validator->errors()->add(
                            "fee_categories.{$index}.slot_limit",
                            'A fee category slot limit cannot exceed the event capacity.',
                        );
                    }
                });
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
            'name.required' => 'Enter an event name.',
            'date_from.required' => 'Enter the event start date.',
            'date_to.required' => 'Enter the event end date.',
            'date_to.after_or_equal' => 'The event end date must be on or after the start date.',
            'venue.required' => 'Enter the event venue.',
            'registration_open_at.required' => 'Enter the registration opening date and time.',
            'registration_close_at.required' => 'Enter the registration closing date and time.',
            'registration_close_at.after' => 'The registration closing date and time must be after the opening date and time.',
            'total_capacity.required' => 'Enter the total event capacity.',
            'total_capacity.min' => 'The total event capacity must be at least 1.',
            'status.required' => 'Choose an event status.',
            'status.in' => 'Choose a valid event status.',
            'scope_type.required' => 'Choose an event scope.',
            'scope_type.in' => 'Choose a valid event scope.',
            'section_id.exists' => 'Choose a valid section.',
            'department_id.exists' => 'Choose a valid department.',
            'fee_categories.required' => 'Add at least one fee category.',
            'fee_categories.min' => 'Add at least one fee category.',
            'fee_categories.*.category_name.required' => 'Enter a fee category name.',
            'fee_categories.*.amount.required' => 'Enter a fee category amount.',
            'fee_categories.*.amount.min' => 'Fee category amounts must be greater than zero.',
            'fee_categories.*.slot_limit.min' => 'Fee category slot limits must be at least 1 when provided.',
            'fee_categories.*.status.required' => 'Choose a fee category status.',
            'fee_categories.*.status.in' => 'Choose a valid fee category status.',
        ];
    }
}
