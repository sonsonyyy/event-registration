<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexRegistrationVerificationRequest;
use App\Http\Requests\UpdateRegistrationVerificationRequest;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\RegistrationReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RegistrationVerificationController extends Controller
{
    public function index(IndexRegistrationVerificationRequest $request): Response
    {
        Gate::authorize('viewAnyVerification', Registration::class);

        $user = $request->user();
        $filters = $request->filters();
        $registrations = $this->verificationIndexQuery($user, $filters['search'], $filters['status'])
            ->paginate($filters['per_page'])
            ->withQueryString();

        return Inertia::render('registrations/verification/index', [
            'scopeSummary' => $this->scopeSummary($user),
            'summary' => $this->summaryData($user),
            'registrations' => [
                'data' => $registrations->getCollection()
                    ->map(fn (Registration $registration): array => $this->registrationData($registration))
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
            'statusOptions' => $this->statusOptions(),
            'perPageOptions' => [10, 25, 50],
        ]);
    }

    public function update(UpdateRegistrationVerificationRequest $request, Registration $registration): RedirectResponse
    {
        $decision = $request->decision();
        $reviewReason = $request->reviewReason();
        $reviewNotes = $request->reviewNotes();

        DB::transaction(function () use ($decision, $request, $registration, $reviewReason, $reviewNotes): void {
            $registration = Registration::query()
                ->with([
                    'event',
                    'items.feeCategory',
                    'pastor.section.district',
                ])
                ->lockForUpdate()
                ->findOrFail($registration->getKey());

            Gate::authorize('verifyReceipt', $registration);

            if (! $registration->canBeReviewed()) {
                throw ValidationException::withMessages([
                    'decision' => 'This registration is not available for receipt verification.',
                ]);
            }

            if (
                $decision === Registration::STATUS_VERIFIED
                && ! $registration->reservesCapacity()
            ) {
                $this->guardVerificationCapacity($registration);
            }

            $registration->forceFill([
                'registration_status' => $decision,
                'verified_at' => $decision === Registration::STATUS_VERIFIED ? now() : null,
                'verified_by_user_id' => $decision === Registration::STATUS_VERIFIED
                    ? $request->user()->getKey()
                    : null,
            ])->save();

            $registration->reviews()->create([
                'reviewer_user_id' => $request->user()->getKey(),
                'decision' => $decision,
                'reason' => $reviewReason,
                'notes' => $reviewNotes,
                'decided_at' => now(),
            ]);

            $registration->event
                ->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                ->syncOperationalStatus();
        });

        return back()->with(
            'success',
            match ($decision) {
                Registration::STATUS_VERIFIED => 'Registration verified successfully.',
                Registration::STATUS_NEEDS_CORRECTION => 'Registration returned for correction successfully.',
                default => 'Registration rejected successfully.',
            },
        );
    }

    public function receipt(Registration $registration): StreamedResponse
    {
        Gate::authorize('view', $registration);

        if (
            $registration->registration_mode !== Registration::MODE_ONLINE
            || $registration->receipt_file_path === null
        ) {
            abort(404);
        }

        $disk = (string) config('registration.receipts_disk');

        if (! Storage::disk($disk)->exists($registration->receipt_file_path)) {
            abort(404);
        }

        return Storage::disk($disk)->response(
            $registration->receipt_file_path,
            $registration->receipt_original_name ?? basename($registration->receipt_file_path),
        );
    }

    private function verificationIndexQuery(User $user, string $search, string $status): Builder
    {
        $query = Registration::query()
            ->where('registration_mode', Registration::MODE_ONLINE)
            ->with([
                'encodedByUser',
                'event',
                'items.feeCategory',
                'latestReview.reviewer',
                'pastor.section.district',
                'reviews.reviewer',
                'verifiedByUser',
            ])
            ->withSum('items as total_amount', 'subtotal_amount')
            ->withSum('items as total_quantity', 'quantity')
            ->orderByRaw(
                'case when registration_status = ? then 0 when registration_status = ? then 1 when registration_status = ? then 2 when registration_status = ? then 3 else 4 end',
                [
                    Registration::STATUS_PENDING_VERIFICATION,
                    Registration::STATUS_NEEDS_CORRECTION,
                    Registration::STATUS_VERIFIED,
                    Registration::STATUS_REJECTED,
                ],
            )
            ->orderByDesc('submitted_at')
            ->orderByDesc('id');

        if ($user->isManager()) {
            $query->whereHas('pastor', function (Builder $pastorQuery) use ($user): void {
                $pastorQuery->where('section_id', $user->section_id);
            });
        }

        if ($status === 'all') {
            $query->whereIn('registration_status', Registration::verificationStatuses());
        } else {
            $query->where('registration_status', $status);
        }

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search): void {
                $like = '%'.$search.'%';

                $searchQuery
                    ->where('payment_reference', 'like', $like)
                    ->orWhere('receipt_original_name', 'like', $like)
                    ->orWhere('remarks', 'like', $like)
                    ->orWhereHas('event', function (Builder $eventQuery) use ($like): void {
                        $eventQuery
                            ->where('name', 'like', $like)
                            ->orWhere('venue', 'like', $like)
                            ->orWhere('description', 'like', $like);
                    })
                    ->orWhereHas('pastor', function (Builder $pastorQuery) use ($like): void {
                        $pastorQuery
                            ->where('church_name', 'like', $like)
                            ->orWhere('pastor_name', 'like', $like)
                            ->orWhere('contact_number', 'like', $like)
                            ->orWhere('email', 'like', $like);
                    })
                    ->orWhereHas('encodedByUser', function (Builder $userQuery) use ($like): void {
                        $userQuery
                            ->where('name', 'like', $like)
                            ->orWhere('email', 'like', $like);
                    });
            });
        }

        return $query;
    }

    /**
     * Build the queue summary counts for the authenticated reviewer scope.
     *
     * @return array{pending_verification: int, needs_correction: int, verified: int, rejected: int}
     */
    private function summaryData(User $user): array
    {
        $query = Registration::query()
            ->where('registration_mode', Registration::MODE_ONLINE);

        if ($user->isManager()) {
            $query->whereHas('pastor', function (Builder $pastorQuery) use ($user): void {
                $pastorQuery->where('section_id', $user->section_id);
            });
        }

        return [
            'pending_verification' => (clone $query)
                ->where('registration_status', Registration::STATUS_PENDING_VERIFICATION)
                ->count(),
            'needs_correction' => (clone $query)
                ->where('registration_status', Registration::STATUS_NEEDS_CORRECTION)
                ->count(),
            'verified' => (clone $query)
                ->where('registration_status', Registration::STATUS_VERIFIED)
                ->count(),
            'rejected' => (clone $query)
                ->where('registration_status', Registration::STATUS_REJECTED)
                ->count(),
        ];
    }

    private function scopeSummary(User $user): string
    {
        if ($user->isAdmin()) {
            return 'all sections';
        }

        $section = $user->section()
            ->with('district')
            ->first();

        if ($section === null) {
            return 'your assigned scope';
        }

        return $section->district->name.' • '.$section->name;
    }

    /**
     * Build the verification status options used by the filter select.
     *
     * @return array<int, array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return [
            [
                'value' => Registration::STATUS_PENDING_VERIFICATION,
                'label' => 'Pending review',
            ],
            [
                'value' => Registration::STATUS_NEEDS_CORRECTION,
                'label' => 'Needs correction',
            ],
            [
                'value' => Registration::STATUS_VERIFIED,
                'label' => 'Verified',
            ],
            [
                'value' => Registration::STATUS_REJECTED,
                'label' => 'Rejected',
            ],
            [
                'value' => 'all',
                'label' => 'All statuses',
            ],
        ];
    }

    /**
     * Transform a registration for the verification queue page.
     *
     * @return array<string, mixed>
     */
    private function registrationData(Registration $registration): array
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
            'submitted_by' => $registration->encodedByUser ? [
                'id' => $registration->encodedByUser->getKey(),
                'name' => $registration->encodedByUser->name,
                'email' => $registration->encodedByUser->email,
            ] : null,
            'payment_reference' => $registration->payment_reference,
            'registration_status' => $registration->registration_status,
            'can_review' => $registration->canBeReviewed(),
            'total_quantity' => $registration->totalQuantity(),
            'total_amount' => $registration->totalAmount(),
            'remarks' => $registration->remarks,
            'submitted_at' => $registration->submitted_at?->toIso8601String(),
            'verified_at' => $registration->verified_at?->toIso8601String(),
            'verified_by' => $registration->verifiedByUser ? [
                'id' => $registration->verifiedByUser->getKey(),
                'name' => $registration->verifiedByUser->name,
            ] : null,
            'latest_review' => $this->reviewData($registration->latestReview),
            'review_history' => $registration->reviews
                ->map(fn (RegistrationReview $review): array => $this->reviewData($review))
                ->values()
                ->all(),
            'receipt' => [
                'original_name' => $registration->receipt_original_name,
                'uploaded_at' => $registration->receipt_uploaded_at?->toIso8601String(),
                'url' => route('registrations.verification.receipt', $registration),
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
     * Ensure a non-reserved registration can still be verified against capacity.
     */
    private function guardVerificationCapacity(Registration $registration): void
    {
        $event = Event::query()
            ->whereKey($registration->event_id)
            ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
            ->firstOrFail();

        if ($registration->totalQuantity() > $event->remainingSlots()) {
            throw ValidationException::withMessages([
                'decision' => 'This registration can no longer be verified because the event capacity is already exhausted.',
            ]);
        }

        $eventFeeCategoryIds = $registration->items
            ->pluck('fee_category_id')
            ->values()
            ->all();

        $feeCategories = EventFeeCategory::query()
            ->whereIn('id', $eventFeeCategoryIds)
            ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
            ->get()
            ->keyBy('id');

        $registration->items->each(function (RegistrationItem $item) use ($feeCategories): void {
            /** @var EventFeeCategory|null $feeCategory */
            $feeCategory = $feeCategories->get($item->fee_category_id);

            if ($feeCategory === null) {
                throw ValidationException::withMessages([
                    'decision' => 'One or more fee categories attached to this registration are no longer available.',
                ]);
            }

            $remainingSlots = $feeCategory->remainingSlots();

            if ($remainingSlots !== null && $item->quantity > $remainingSlots) {
                throw ValidationException::withMessages([
                    'decision' => 'This registration can no longer be verified because one of its fee categories is already full.',
                ]);
            }
        });
    }

    /**
     * Transform a review record for queue history payloads.
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
