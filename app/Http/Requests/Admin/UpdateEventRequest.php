<?php

namespace App\Http\Requests\Admin;

use App\Models\Department;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Section;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateEventRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('event')) ?? false;
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
            'fee_categories.*.id' => ['nullable', 'integer'],
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
                /** @var Event $event */
                $event = $this->route('event');
                $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');
                $event->load([
                    'feeCategories' => fn ($query) => $query
                        ->withCount('registrationItems')
                        ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                        ->orderBy('id'),
                ]);

                $feeCategories = collect($this->input('fee_categories', []));
                $submittedIds = $feeCategories
                    ->pluck('id')
                    ->filter()
                    ->map(fn (mixed $id): int => (int) $id)
                    ->values();
                $normalizedNames = $feeCategories
                    ->pluck('category_name')
                    ->map(fn (mixed $name): string => mb_strtolower(trim((string) $name)))
                    ->filter();
                $existingCategoryIds = $event->feeCategories->pluck('id');
                $totalCapacity = (int) $this->input('total_capacity', 0);

                if ($submittedIds->duplicates()->isNotEmpty()) {
                    $validator->errors()->add('fee_categories', 'Each fee category can only be submitted once.');
                }

                if ($normalizedNames->duplicates()->isNotEmpty()) {
                    $validator->errors()->add('fee_categories', 'Fee category names must be unique per event.');
                }

                if ($this->input('scope_type') === Event::SCOPE_SECTION && ! $this->filled('section_id')) {
                    $validator->errors()->add('section_id', 'Choose the section that owns this sectional event.');
                }

                if ($this->input('scope_type') === Event::SCOPE_DISTRICT && $this->filled('section_id')) {
                    $validator->errors()->add('section_id', 'District-wide events cannot be assigned to a section.');
                }

                $invalidIds = $submittedIds->diff($existingCategoryIds);

                if ($invalidIds->isNotEmpty()) {
                    $validator->errors()->add('fee_categories', 'One or more fee categories do not belong to this event.');
                }

                if ($totalCapacity < $event->reservedQuantity()) {
                    $validator->errors()->add('total_capacity', 'The event capacity cannot be lower than the quantity already reserved.');
                }

                $slotLimitTotal = $feeCategories->sum(fn (array $category): int => (int) ($category['slot_limit'] ?? 0));

                if ($slotLimitTotal > $totalCapacity) {
                    $validator->errors()->add('fee_categories', 'Combined fee category slot limits cannot exceed the event capacity.');
                }

                $existingCategories = $event->feeCategories->keyBy('id');

                $feeCategories->each(function (array $category, int $index) use ($existingCategories, $totalCapacity, $validator): void {
                    $slotLimit = $category['slot_limit'] ?? null;
                    $categoryId = isset($category['id']) ? (int) $category['id'] : null;

                    if ($slotLimit !== null && (int) $slotLimit > $totalCapacity) {
                        $validator->errors()->add(
                            "fee_categories.{$index}.slot_limit",
                            'A fee category slot limit cannot exceed the event capacity.',
                        );
                    }

                    if ($categoryId === null || $slotLimit === null) {
                        return;
                    }

                    /** @var EventFeeCategory|null $existingCategory */
                    $existingCategory = $existingCategories->get($categoryId);

                    if ($existingCategory !== null && (int) $slotLimit < $existingCategory->reservedQuantity()) {
                        $validator->errors()->add(
                            "fee_categories.{$index}.slot_limit",
                            'The fee category slot limit cannot be lower than its already reserved quantity.',
                        );
                    }
                });

                $submittedIdMap = $submittedIds->all();
                $removedCategories = $event->feeCategories->reject(
                    fn (EventFeeCategory $feeCategory): bool => in_array($feeCategory->getKey(), $submittedIdMap, true),
                );

                $removedCategories->each(function (EventFeeCategory $feeCategory) use ($validator): void {
                    if ($feeCategory->registration_items_count > 0) {
                        $validator->errors()->add(
                            'fee_categories',
                            sprintf('The fee category "%s" cannot be removed because it already has registrations.', $feeCategory->category_name),
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
