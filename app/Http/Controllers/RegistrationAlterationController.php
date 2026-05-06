<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateRegistrationAlterationRequest;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Registration;
use App\Models\RegistrationHistory;
use App\Models\RegistrationItem;
use App\Models\RegistrationReview;
use App\Models\User;
use App\Support\DepartmentScopeAccess;
use App\Support\EventCapacity;
use App\Support\RegistrationReceiptStorage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RegistrationAlterationController extends Controller
{
    public function __construct(
        private readonly EventCapacity $eventCapacity,
        private readonly RegistrationReceiptStorage $registrationReceiptStorage,
    ) {}

    public function edit(Request $request, Registration $registration): Response
    {
        Gate::authorize('alterVerification', $registration);
        abort_unless($registration->canBeAlteredForVerification(), 403);

        $registration = Registration::query()
            ->with([
                'event',
                'histories.alteredByUser',
                'items.feeCategory',
                'pastor.section.district',
                'reviews.reviewer',
            ])
            ->findOrFail($registration->getKey());

        return Inertia::render('registrations/verification/alter', [
            'assignedPastor' => $this->assignedPastorData($registration),
            'events' => $this->eventOptions($request->user(), $registration),
            'registration' => $this->editableRegistrationData($registration),
            'alterationHistory' => $registration->histories
                ->map(fn (RegistrationHistory $history): array => $this->historyData($history))
                ->values()
                ->all(),
        ]);
    }

    public function update(
        UpdateRegistrationAlterationRequest $request,
        Registration $registration,
    ): RedirectResponse {
        $validated = $request->validated();
        $receipt = $request->file('receipt');
        $replacementReceiptPath = $receipt instanceof UploadedFile
            ? $this->registrationReceiptStorage->store($receipt)
            : null;
        $replacementUploadedAt = $receipt instanceof UploadedFile ? now() : null;
        $previousReceiptPath = null;
        $updatedRegistration = null;

        try {
            DB::transaction(function () use (
                $request,
                $registration,
                $validated,
                $receipt,
                $replacementReceiptPath,
                $replacementUploadedAt,
                &$previousReceiptPath,
                &$updatedRegistration,
            ): void {
                $registration = Registration::query()
                    ->with([
                        'event',
                        'items.feeCategory',
                        'pastor.section.district',
                        'encodedByUser',
                    ])
                    ->lockForUpdate()
                    ->findOrFail($registration->getKey());

                Gate::authorize('alterVerification', $registration);
                abort_unless($registration->canBeAlteredForVerification(), 403);

                $originalEventId = $registration->event_id;
                $event = Event::query()
                    ->lockForUpdate()
                    ->findOrFail($validated['event_id']);
                $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');

                if (
                    $originalEventId !== $event->getKey()
                    && ! $event->canAcceptRegistrations()
                ) {
                    throw ValidationException::withMessages([
                        'event_id' => 'The selected event is not open for online registration.',
                    ]);
                }

                $lineItems = collect($validated['line_items']);
                $feeCategories = EventFeeCategory::query()
                    ->where('event_id', $event->getKey())
                    ->whereIn('id', $lineItems->pluck('fee_category_id')->all())
                    ->lockForUpdate()
                    ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                    ->get()
                    ->keyBy('id');

                $this->guardLineItems($event, $feeCategories, $lineItems, $registration);

                if ($replacementReceiptPath !== null) {
                    $previousReceiptPath = $registration->receipt_file_path;
                }

                $registration->histories()->create([
                    'altered_by_user_id' => $request->user()->getKey(),
                    'snapshot' => $registration->historySnapshot(),
                    'altered_at' => now(),
                ]);

                $registration->forceFill([
                    'event_id' => $event->getKey(),
                    'payment_reference' => $validated['payment_reference'],
                    'remarks' => $validated['remarks'] ?: null,
                    'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
                    'verified_at' => null,
                    'verified_by_user_id' => null,
                    'receipt_file_path' => $replacementReceiptPath ?? $registration->receipt_file_path,
                    'receipt_original_name' => $receipt instanceof UploadedFile
                        ? $receipt->getClientOriginalName()
                        : $registration->receipt_original_name,
                    'receipt_uploaded_at' => $replacementUploadedAt ?? $registration->receipt_uploaded_at,
                    'receipt_uploaded_by_user_id' => $replacementReceiptPath !== null
                        ? $request->user()->getKey()
                        : $registration->receipt_uploaded_by_user_id,
                ])->save();

                $registration->items()->delete();
                $this->persistLineItems($registration, $lineItems, $feeCategories);
                $this->syncEventStatuses([$originalEventId, $registration->event_id]);
                $updatedRegistration = $registration;
            });
        } catch (Throwable $throwable) {
            if ($replacementReceiptPath !== null) {
                $this->registrationReceiptStorage->delete($replacementReceiptPath);
            }

            throw $throwable;
        }

        if (
            $replacementReceiptPath !== null
            && $previousReceiptPath !== null
            && $previousReceiptPath !== $replacementReceiptPath
        ) {
            $this->registrationReceiptStorage->delete($previousReceiptPath);
        }

        return to_route(
            'registrations.verification.alter.edit',
            $updatedRegistration ?? $registration,
        )->with('success', 'Registration altered successfully.');
    }

    /**
     * Build the event options available to this alteration workflow.
     *
     * @return array<int, array<string, mixed>>
     */
    private function eventOptions(?User $user, ?Registration $registration = null): array
    {
        $currentEventId = $registration?->event_id;
        $currentFeeItemQuantities = $registration?->items
            ->mapWithKeys(fn (RegistrationItem $item): array => [
                $item->fee_category_id => (int) $item->quantity,
            ]) ?? collect();
        $currentFeeCategoryIds = $currentFeeItemQuantities->keys()->all();

        return Event::query()
            ->when(
                $user !== null,
                fn (Builder $query) => DepartmentScopeAccess::scopeAccessibleEvents($query, $user),
                fn (Builder $query) => $query->whereRaw('1 = 0'),
            )
            ->when(
                $currentEventId !== null,
                fn (Builder $query) => $query->where(function (Builder $builder) use ($currentEventId): void {
                    $builder
                        ->where('status', Event::STATUS_OPEN)
                        ->orWhere('id', $currentEventId);
                }),
                fn (Builder $query) => $query->where('status', Event::STATUS_OPEN),
            )
            ->withCapacityMetrics()
            ->with([
                'feeCategories' => fn ($query) => $query
                    ->when(
                        $currentFeeCategoryIds !== [],
                        fn ($feeQuery) => $feeQuery->where(function (Builder $builder) use ($currentFeeCategoryIds): void {
                            $builder
                                ->where('status', 'active')
                                ->orWhereIn('id', $currentFeeCategoryIds);
                        }),
                        fn ($feeQuery) => $feeQuery->where('status', 'active'),
                    )
                    ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                    ->orderBy('category_name'),
            ])
            ->orderBy('date_from')
            ->get()
            ->each(fn (Event $event): bool => $event->syncOperationalStatus())
            ->filter(function (Event $event) use ($currentEventId): bool {
                if ($event->feeCategories->isEmpty()) {
                    return false;
                }

                if ($currentEventId !== null && $event->getKey() === $currentEventId) {
                    return true;
                }

                if (! $event->canAcceptRegistrations()) {
                    return false;
                }

                return $this->eventCapacity->eventHasAvailableFeeCategories($event);
            })
            ->map(function (Event $event) use (
                $registration,
                $currentEventId,
                $currentFeeItemQuantities,
            ): array {
                $currentRegistration = $currentEventId !== null && $event->getKey() === $currentEventId
                    ? $registration
                    : null;

                return [
                    'id' => $event->getKey(),
                    'name' => $event->name,
                    'venue' => $event->venue,
                    'description' => $event->description,
                    'date_from' => $event->date_from->toDateString(),
                    'date_to' => $event->date_to->toDateString(),
                    'registration_close_at' => $event->registration_close_at->toIso8601String(),
                    'remaining_slots' => $this->eventCapacity->availableSlotsForEvent($event, $currentRegistration),
                    'fee_categories' => $event->feeCategories
                        ->filter(function (EventFeeCategory $feeCategory) use ($currentEventId, $event, $currentFeeItemQuantities): bool {
                            $currentQuantity = $currentEventId !== null && $event->getKey() === $currentEventId
                                ? (int) $currentFeeItemQuantities->get($feeCategory->getKey(), 0)
                                : 0;

                            if ($currentQuantity > 0) {
                                return true;
                            }

                            $remainingSlots = $this->eventCapacity->availableSlotsForFeeCategory($feeCategory);

                            return $feeCategory->status === 'active'
                                && ($remainingSlots === null || $remainingSlots > 0);
                        })
                        ->map(function (EventFeeCategory $feeCategory) use ($currentEventId, $event, $currentFeeItemQuantities): array {
                            $currentQuantity = $currentEventId !== null && $event->getKey() === $currentEventId
                                ? (int) $currentFeeItemQuantities->get($feeCategory->getKey(), 0)
                                : 0;

                            return [
                                'id' => $feeCategory->getKey(),
                                'category_name' => $feeCategory->category_name,
                                'amount' => (string) $feeCategory->amount,
                                'slot_limit' => $feeCategory->slot_limit,
                                'remaining_slots' => $this->eventCapacity->availableSlotsForFeeCategory($feeCategory, $currentQuantity),
                                'status' => $feeCategory->status,
                            ];
                        })
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function assignedPastorData(Registration $registration): array
    {
        return [
            'id' => $registration->pastor->getKey(),
            'pastor_name' => $registration->pastor->pastor_name,
            'church_name' => $registration->pastor->church_name,
            'section_name' => $registration->pastor->section->name,
            'district_name' => $registration->pastor->section->district->name,
            'status' => $registration->pastor->status,
        ];
    }

    /**
     * @param  Collection<int, EventFeeCategory>  $feeCategories
     * @param  Collection<int, array<string, mixed>>  $lineItems
     */
    private function guardLineItems(
        Event $event,
        Collection $feeCategories,
        Collection $lineItems,
        ?Registration $existingRegistration = null,
    ): void {
        $errors = $this->eventCapacity->lineItemErrors($event, $feeCategories, $lineItems, $existingRegistration);

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $lineItems
     * @param  Collection<int, EventFeeCategory>  $feeCategories
     */
    private function persistLineItems(
        Registration $registration,
        Collection $lineItems,
        Collection $feeCategories,
    ): void {
        $lineItems->each(function (array $lineItem) use ($feeCategories, $registration): void {
            /** @var EventFeeCategory $feeCategory */
            $feeCategory = $feeCategories->get((int) $lineItem['fee_category_id']);
            $quantity = (int) $lineItem['quantity'];
            $unitAmount = (string) $feeCategory->amount;

            $registration->items()->create([
                'fee_category_id' => $feeCategory->getKey(),
                'quantity' => $quantity,
                'unit_amount' => $unitAmount,
                'subtotal_amount' => bcmul($unitAmount, (string) $quantity, 2),
                'remarks' => null,
            ]);
        });
    }

    /**
     * @param  array<int, int|null>  $eventIds
     */
    private function syncEventStatuses(array $eventIds): void
    {
        $uniqueEventIds = collect($eventIds)
            ->filter()
            ->map(fn (mixed $eventId): int => (int) $eventId)
            ->unique()
            ->values();

        Event::query()
            ->whereIn('id', $uniqueEventIds->all())
            ->get()
            ->each(function (Event $event): void {
                $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');
                $event->syncOperationalStatus();
            });
    }

    /**
     * @return array<string, mixed>
     */
    private function editableRegistrationData(Registration $registration): array
    {
        return [
            'id' => $registration->getKey(),
            'event_id' => (string) $registration->event_id,
            'payment_reference' => $registration->payment_reference,
            'registration_status' => $registration->registration_status,
            'remarks' => $registration->remarks,
            'submitted_at' => $registration->submitted_at?->toIso8601String(),
            'receipt' => [
                'original_name' => $registration->receipt_original_name,
                'uploaded_at' => $registration->receipt_uploaded_at?->toIso8601String(),
            ],
            'latest_review' => $this->reviewData($registration->latestReview),
            'review_history' => $registration->reviews
                ->map(fn (RegistrationReview $review): array => $this->reviewData($review))
                ->values()
                ->all(),
            'line_items' => $registration->items
                ->map(fn (RegistrationItem $item): array => [
                    'fee_category_id' => (string) $item->fee_category_id,
                    'quantity' => (string) $item->quantity,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function historyData(RegistrationHistory $history): array
    {
        /** @var array<string, mixed> $snapshot */
        $snapshot = $history->snapshot ?? [];
        /** @var array<string, mixed> $registration */
        $registration = $snapshot['registration'] ?? [];
        /** @var array<int, array<string, mixed>> $lineItems */
        $lineItems = $snapshot['line_items'] ?? [];

        return [
            'id' => $history->getKey(),
            'altered_at' => $history->altered_at?->toIso8601String(),
            'altered_by' => $history->alteredByUser ? [
                'id' => $history->alteredByUser->getKey(),
                'name' => $history->alteredByUser->name,
            ] : null,
            'snapshot' => [
                'event_name' => $registration['event_name'] ?? null,
                'church_name' => $registration['church_name'] ?? null,
                'pastor_name' => $registration['pastor_name'] ?? null,
                'payment_reference' => $registration['payment_reference'] ?? null,
                'registration_status' => $registration['registration_status'] ?? null,
                'remarks' => $registration['remarks'] ?? null,
                'total_quantity' => (int) ($registration['total_quantity'] ?? 0),
                'total_amount' => (string) ($registration['total_amount'] ?? '0.00'),
                'line_items' => collect($lineItems)
                    ->map(fn (array $lineItem): array => [
                        'category_name' => (string) ($lineItem['category_name'] ?? 'Fee category'),
                        'quantity' => (int) ($lineItem['quantity'] ?? 0),
                        'unit_amount' => (string) ($lineItem['unit_amount'] ?? '0.00'),
                        'subtotal_amount' => (string) ($lineItem['subtotal_amount'] ?? '0.00'),
                    ])
                    ->values()
                    ->all(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function reviewData(?RegistrationReview $review): ?array
    {
        if ($review === null) {
            return null;
        }

        return [
            'id' => $review->getKey(),
            'decision' => $review->decision,
            'reason' => $review->reason,
            'notes' => $review->notes,
            'decided_at' => $review->decided_at?->toIso8601String(),
            'reviewer' => $review->reviewer ? [
                'id' => $review->reviewer->getKey(),
                'name' => $review->reviewer->name,
            ] : null,
        ];
    }
}
