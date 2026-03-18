<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancelOnlineRegistrationRequest;
use App\Http\Requests\IndexOnlineRegistrationRequest;
use App\Http\Requests\StoreOnlineRegistrationRequest;
use App\Http\Requests\UpdateOnlineRegistrationRequest;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\RegistrationReview;
use App\Models\User;
use App\Notifications\RegistrationResubmitted;
use App\Notifications\RegistrationSubmittedForReview;
use App\Support\DepartmentScopeAccess;
use App\Support\EventCapacity;
use App\Support\NotificationRecipientResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OnlineRegistrationController extends Controller
{
    public function __construct(
        private readonly EventCapacity $eventCapacity,
        private readonly NotificationRecipientResolver $notificationRecipientResolver,
    ) {}

    public function index(IndexOnlineRegistrationRequest $request): Response
    {
        Gate::authorize('viewAnyOnline', Registration::class);

        $user = $request->user();
        $filters = $request->filters();
        $registrations = $this->onlineRegistrationIndexQuery($user, $filters['search'])
            ->paginate($filters['per_page'])
            ->withQueryString();

        return Inertia::render('registrations/online/index', [
            'assignedPastor' => $this->assignedPastorData($user),
            'registrations' => [
                'data' => $registrations->getCollection()
                    ->map(fn (Registration $registration): array => $this->registrationData($registration, $user))
                    ->values()
                    ->all(),
                'meta' => [
                    'current_page' => $registrations->currentPage(),
                    'last_page' => $registrations->lastPage(),
                    'per_page' => $registrations->perPage(),
                    'from' => $registrations->firstItem(),
                    'to' => $registrations->lastItem(),
                    'total' => $registrations->total(),
                ],
            ],
            'filters' => $filters,
            'perPageOptions' => [10, 25, 50],
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('viewAnyOnline', Registration::class);

        return Inertia::render('registrations/online/create', [
            'assignedPastor' => $this->assignedPastorData($request->user()),
            'events' => $this->eventOptions($request->user()),
        ]);
    }

    public function edit(Request $request, Registration $registration): Response
    {
        Gate::authorize('updateOnline', $registration);

        $registration = Registration::query()
            ->with([
                'items.feeCategory',
                'reviews.reviewer',
            ])
            ->findOrFail($registration->getKey());

        return Inertia::render('registrations/online/edit', [
            'assignedPastor' => $this->assignedPastorData($request->user()),
            'events' => $this->eventOptions($request->user(), $registration),
            'registration' => $this->editableRegistrationData($registration),
        ]);
    }

    public function store(StoreOnlineRegistrationRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $receipt = $request->file('receipt');
        $storedRegistration = null;

        if (! $receipt instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'receipt' => 'Upload proof of payment before submitting the registration.',
            ]);
        }

        $receiptDisk = (string) config('registration.receipts_disk');
        $receiptPath = $this->storeReceipt($receipt, $receiptDisk);
        $receiptUploadedAt = now();

        try {
            DB::transaction(function () use (
                $request,
                $validated,
                $receipt,
                $receiptPath,
                $receiptUploadedAt,
                &$storedRegistration,
            ): void {
                $event = Event::query()
                    ->lockForUpdate()
                    ->findOrFail($validated['event_id']);
                $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');
                $event->syncOperationalStatus();

                if (! $event->canAcceptRegistrations()) {
                    throw ValidationException::withMessages([
                        'event_id' => 'The selected event is not open for online registration.',
                    ]);
                }

                $pastor = $request->user()->pastor()->firstOrFail();
                Gate::authorize('createOnline', [Registration::class, $pastor, $event]);

                if ($pastor->status !== 'active') {
                    throw ValidationException::withMessages([
                        'event_id' => 'Your assigned church account must be active before it can register online.',
                    ]);
                }

                if (! DepartmentScopeAccess::canAccessEvent($request->user(), $event)) {
                    throw ValidationException::withMessages([
                        'event_id' => 'The selected event is not available to your account.',
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

                $this->guardLineItems($event, $feeCategories, $lineItems);

                $registration = Registration::query()->create([
                    'event_id' => $event->getKey(),
                    'pastor_id' => $pastor->getKey(),
                    'encoded_by_user_id' => $request->user()->getKey(),
                    'registration_mode' => Registration::MODE_ONLINE,
                    'payment_status' => Registration::PAYMENT_STATUS_PAID,
                    'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
                    'payment_reference' => $validated['payment_reference'],
                    'receipt_file_path' => $receiptPath,
                    'receipt_original_name' => $receipt->getClientOriginalName(),
                    'receipt_uploaded_at' => $receiptUploadedAt,
                    'receipt_uploaded_by_user_id' => $request->user()->getKey(),
                    'remarks' => $validated['remarks'] ?: null,
                    'submitted_at' => $receiptUploadedAt,
                    'verified_at' => null,
                    'verified_by_user_id' => null,
                ]);

                $this->persistLineItems($registration, $lineItems, $feeCategories);
                $storedRegistration = $registration->loadMissing('event', 'pastor.section.district', 'encodedByUser.role');
            });
        } catch (Throwable $throwable) {
            Storage::disk($receiptDisk)->delete($receiptPath);

            throw $throwable;
        }

        if ($storedRegistration instanceof Registration) {
            $this->notifyReviewers($storedRegistration, false);
        }

        return to_route('registrations.online.index')
            ->with('success', 'Online registration submitted.');
    }

    public function update(UpdateOnlineRegistrationRequest $request, Registration $registration): RedirectResponse
    {
        $validated = $request->validated();
        $receipt = $request->file('receipt');
        $receiptDisk = (string) config('registration.receipts_disk');
        $replacementReceiptPath = $receipt instanceof UploadedFile
            ? $this->storeReceipt($receipt, $receiptDisk)
            : null;
        $replacementUploadedAt = $receipt instanceof UploadedFile ? now() : null;
        $previousReceiptPath = null;
        $updatedRegistration = null;
        $wasCorrectionResubmission = false;

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
                &$wasCorrectionResubmission,
            ): void {
                $registration = Registration::query()
                    ->with([
                        'items.feeCategory',
                    ])
                    ->lockForUpdate()
                    ->findOrFail($registration->getKey());

                Gate::authorize('updateOnline', $registration);
                $wasCorrectionResubmission = $registration->registration_status === Registration::STATUS_NEEDS_CORRECTION;

                $pastor = $request->user()->pastor()->firstOrFail();

                if ($pastor->status !== 'active') {
                    throw ValidationException::withMessages([
                        'event_id' => 'Your assigned church account must be active before it can register online.',
                    ]);
                }

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

                Gate::authorize('createOnline', [Registration::class, $pastor, $event]);

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

                $submittedAt = now();

                $registration->forceFill([
                    'event_id' => $event->getKey(),
                    'payment_reference' => $validated['payment_reference'],
                    'remarks' => $validated['remarks'] ?: null,
                    'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
                    'submitted_at' => $submittedAt,
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
                $updatedRegistration = $registration->loadMissing('event', 'pastor.section.district', 'encodedByUser.role');
            });
        } catch (Throwable $throwable) {
            if ($replacementReceiptPath !== null) {
                Storage::disk($receiptDisk)->delete($replacementReceiptPath);
            }

            throw $throwable;
        }

        if (
            $replacementReceiptPath !== null
            && $previousReceiptPath !== null
            && $previousReceiptPath !== $replacementReceiptPath
        ) {
            Storage::disk($receiptDisk)->delete($previousReceiptPath);
        }

        if ($updatedRegistration instanceof Registration && $wasCorrectionResubmission) {
            $this->notifyReviewers($updatedRegistration, true);
        }

        return to_route('registrations.online.index')
            ->with('success', 'Online registration updated.');
    }

    public function cancel(CancelOnlineRegistrationRequest $request, Registration $registration): RedirectResponse
    {
        DB::transaction(function () use ($registration): void {
            $registration = Registration::query()
                ->with('event')
                ->lockForUpdate()
                ->findOrFail($registration->getKey());

            Gate::authorize('cancelOnline', $registration);

            $registration->forceFill([
                'registration_status' => Registration::STATUS_CANCELLED,
                'verified_at' => null,
                'verified_by_user_id' => null,
            ])->save();

            $this->syncEventStatuses([$registration->event_id]);
        });

        return to_route('registrations.online.index')
            ->with('success', 'Online registration cancelled.');
    }

    /**
     * Build the event options available to online registrants.
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
     * Build the summary of the assigned pastor for the current user.
     *
     * @return array<string, mixed>|null
     */
    private function assignedPastorData(?User $user): ?array
    {
        if ($user === null || $user->pastor_id === null) {
            return null;
        }

        $pastor = $user->pastor()
            ->with('section.district')
            ->first();

        if ($pastor === null) {
            return null;
        }

        return [
            'id' => $pastor->getKey(),
            'pastor_name' => $pastor->pastor_name,
            'church_name' => $pastor->church_name,
            'section_name' => $pastor->section->name,
            'district_name' => $pastor->section->district->name,
            'status' => $pastor->status,
        ];
    }

    /**
     * Persist an uploaded receipt using the configured disk.
     */
    private function storeReceipt(UploadedFile $receipt, string $disk): string
    {
        $directory = trim((string) config('registration.receipt_directory'), '/');
        $destination = $directory.'/'.now()->format('Y/m');

        return $receipt->store($destination, $disk);
    }

    /**
     * Ensure the selected fee categories still satisfy event and category capacity.
     *
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
     * Persist the grouped registration line items.
     *
     * @param  Collection<int, array<string, mixed>>  $lineItems
     * @param  Collection<int, EventFeeCategory>  $feeCategories
     */
    private function persistLineItems(Registration $registration, Collection $lineItems, Collection $feeCategories): void
    {
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
     * Sync event operational status for the affected event IDs.
     *
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

    private function notifyReviewers(Registration $registration, bool $resubmitted): void
    {
        $reviewers = $this->notificationRecipientResolver->reviewersForRegistration($registration);

        if ($reviewers->isEmpty()) {
            return;
        }

        Notification::send(
            $reviewers,
            $resubmitted
                ? new RegistrationResubmitted($registration)
                : new RegistrationSubmittedForReview($registration),
        );
    }

    private function onlineRegistrationIndexQuery(User $user, string $search): Builder
    {
        $query = Registration::query()
            ->where('registration_mode', Registration::MODE_ONLINE)
            ->with([
                'encodedByUser',
                'event',
                'latestReview.reviewer',
                'pastor.section.district',
                'items.feeCategory',
            ])
            ->withSum('items as total_amount', 'subtotal_amount')
            ->withSum('items as total_quantity', 'quantity')
            ->latest('submitted_at')
            ->latest('id');

        if (! $user->isAdmin()) {
            $query->where('pastor_id', $user->pastor_id);
        }

        if ($search !== '') {
            $like = '%'.$search.'%';

            $query->where(function (Builder $searchQuery) use ($like): void {
                $searchQuery
                    ->whereHas('event', function (Builder $eventQuery) use ($like): void {
                        $eventQuery
                            ->where('name', 'like', $like)
                            ->orWhere('venue', 'like', $like)
                            ->orWhere('description', 'like', $like);
                    })
                    ->orWhere('payment_reference', 'like', $like)
                    ->orWhere('receipt_original_name', 'like', $like);
            });
        }

        return $query;
    }

    /**
     * Transform an online registration into its Inertia payload representation.
     *
     * @return array<string, mixed>
     */
    private function registrationData(Registration $registration, User $viewer): array
    {
        return [
            'id' => $registration->getKey(),
            'event' => [
                'id' => $registration->event->getKey(),
                'name' => $registration->event->name,
                'venue' => $registration->event->venue,
            ],
            'pastor' => [
                'id' => $registration->pastor->getKey(),
                'pastor_name' => $registration->pastor->pastor_name,
                'church_name' => $registration->pastor->church_name,
                'section_name' => $registration->pastor->section->name,
                'district_name' => $registration->pastor->section->district->name,
            ],
            'payment_status' => $registration->payment_status,
            'payment_reference' => $registration->payment_reference,
            'registration_status' => $registration->registration_status,
            'total_quantity' => $registration->totalQuantity(),
            'total_amount' => $registration->totalAmount(),
            'remarks' => $registration->remarks,
            'submitted_at' => $registration->submitted_at?->toIso8601String(),
            'submitted_by_name' => $registration->encodedByUser?->name,
            'can_edit' => $viewer->can('updateOnline', $registration),
            'can_cancel' => $viewer->can('cancelOnline', $registration),
            'latest_review' => $this->reviewData($registration->latestReview),
            'receipt' => [
                'original_name' => $registration->receipt_original_name,
                'uploaded_at' => $registration->receipt_uploaded_at?->toIso8601String(),
            ],
            'items' => $registration->items
                ->map(fn (RegistrationItem $item): array => [
                    'id' => $item->getKey(),
                    'category_name' => $item->feeCategory->category_name,
                    'quantity' => $item->quantity,
                    'unit_amount' => $item->unit_amount,
                    'subtotal_amount' => $item->subtotal_amount,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * Transform an editable online registration for the edit page.
     *
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
     * Transform a review record for queue and history payloads.
     *
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
