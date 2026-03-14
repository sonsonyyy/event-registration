<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexOnlineRegistrationRequest;
use App\Http\Requests\StoreOnlineRegistrationRequest;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OnlineRegistrationController extends Controller
{
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
            'perPageOptions' => [10, 25, 50],
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('viewAnyOnline', Registration::class);

        return Inertia::render('registrations/online/create', [
            'assignedPastor' => $this->assignedPastorData($request->user()),
            'events' => $this->eventOptions(),
        ]);
    }

    public function store(StoreOnlineRegistrationRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $receipt = $request->file('receipt');

        if (! $receipt instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'receipt' => 'Upload proof of payment before submitting the registration.',
            ]);
        }

        $receiptDisk = (string) config('registration.receipts_disk');
        $receiptPath = $this->storeReceipt($receipt, $receiptDisk);
        $receiptUploadedAt = now();

        try {
            $registrationId = DB::transaction(function () use ($request, $validated, $receipt, $receiptPath, $receiptUploadedAt): int {
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
                Gate::authorize('createOnline', [Registration::class, $pastor]);

                if ($pastor->status !== 'active') {
                    throw ValidationException::withMessages([
                        'event_id' => 'Your assigned church account must be active before it can register online.',
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
                    'payment_reference' => $validated['payment_reference'] ?: null,
                    'receipt_file_path' => $receiptPath,
                    'receipt_original_name' => $receipt->getClientOriginalName(),
                    'receipt_uploaded_at' => $receiptUploadedAt,
                    'receipt_uploaded_by_user_id' => $request->user()->getKey(),
                    'remarks' => $validated['remarks'] ?: null,
                    'submitted_at' => $receiptUploadedAt,
                    'verified_at' => null,
                    'verified_by_user_id' => null,
                ]);

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

                return $registration->getKey();
            });
        } catch (Throwable $throwable) {
            Storage::disk($receiptDisk)->delete($receiptPath);

            throw $throwable;
        }

        return to_route('registrations.online.index')
            ->with('success', "Online registration #{$registrationId} submitted successfully.");
    }

    /**
     * Build the event options available to online registrants.
     *
     * @return array<int, array<string, mixed>>
     */
    private function eventOptions(): array
    {
        return Event::query()
            ->where('status', Event::STATUS_OPEN)
            ->whereHas('feeCategories', function ($query): void {
                $query->where('status', 'active');
            })
            ->withCapacityMetrics()
            ->with([
                'feeCategories' => fn ($query) => $query
                    ->where('status', 'active')
                    ->withSum('reservedRegistrationItems as reserved_quantity', 'quantity')
                    ->orderBy('category_name'),
            ])
            ->orderBy('date_from')
            ->get()
            ->each(fn (Event $event): bool => $event->syncOperationalStatus())
            ->filter(function (Event $event): bool {
                if (! $event->canAcceptRegistrations()) {
                    return false;
                }

                return $event->feeCategories->contains(function (EventFeeCategory $feeCategory): bool {
                    $remainingSlots = $feeCategory->remainingSlots();

                    return $remainingSlots === null || $remainingSlots > 0;
                });
            })
            ->map(function (Event $event): array {
                return [
                    'id' => $event->getKey(),
                    'name' => $event->name,
                    'venue' => $event->venue,
                    'description' => $event->description,
                    'date_from' => $event->date_from->toDateString(),
                    'date_to' => $event->date_to->toDateString(),
                    'registration_close_at' => $event->registration_close_at->toIso8601String(),
                    'remaining_slots' => $event->remainingSlots(),
                    'fee_categories' => $event->feeCategories
                        ->filter(function (EventFeeCategory $feeCategory): bool {
                            $remainingSlots = $feeCategory->remainingSlots();

                            return $remainingSlots === null || $remainingSlots > 0;
                        })
                        ->map(fn (EventFeeCategory $feeCategory): array => [
                            'id' => $feeCategory->getKey(),
                            'category_name' => $feeCategory->category_name,
                            'amount' => (string) $feeCategory->amount,
                            'slot_limit' => $feeCategory->slot_limit,
                            'remaining_slots' => $feeCategory->remainingSlots(),
                        ])
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
    private function guardLineItems(Event $event, Collection $feeCategories, Collection $lineItems): void
    {
        $totalQuantity = 0;

        $lineItems->each(function (array $lineItem, int $index) use ($feeCategories, &$totalQuantity): void {
            /** @var EventFeeCategory|null $feeCategory */
            $feeCategory = $feeCategories->get((int) $lineItem['fee_category_id']);
            $quantity = (int) $lineItem['quantity'];

            if ($feeCategory === null) {
                throw ValidationException::withMessages([
                    "line_items.{$index}.fee_category_id" => 'Select a valid fee category for the chosen event.',
                ]);
            }

            if ($feeCategory->status !== 'active') {
                throw ValidationException::withMessages([
                    "line_items.{$index}.fee_category_id" => 'The selected fee category is not active.',
                ]);
            }

            $remainingSlots = $feeCategory->remainingSlots();

            if ($remainingSlots !== null && $quantity > $remainingSlots) {
                throw ValidationException::withMessages([
                    "line_items.{$index}.quantity" => 'The selected fee category does not have enough remaining slots.',
                ]);
            }

            $totalQuantity += $quantity;
        });

        if ($totalQuantity > $event->remainingSlots()) {
            throw ValidationException::withMessages([
                'line_items' => 'The requested quantity exceeds the remaining event capacity.',
            ]);
        }
    }

    private function onlineRegistrationIndexQuery(User $user, string $search): Builder
    {
        $query = Registration::query()
            ->where('registration_mode', Registration::MODE_ONLINE)
            ->with([
                'event',
                'pastor.section.district',
                'items.feeCategory',
            ])
            ->withSum('items as total_amount', 'subtotal_amount')
            ->withSum('items as total_quantity', 'quantity')
            ->latest('submitted_at');

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
            'payment_status' => $registration->payment_status,
            'payment_reference' => $registration->payment_reference,
            'registration_status' => $registration->registration_status,
            'total_quantity' => $registration->totalQuantity(),
            'total_amount' => $registration->totalAmount(),
            'remarks' => $registration->remarks,
            'submitted_at' => $registration->submitted_at?->toIso8601String(),
            'receipt' => [
                'original_name' => $registration->receipt_original_name,
                'uploaded_at' => $registration->receipt_uploaded_at?->toIso8601String(),
            ],
            'items' => $registration->items
                ->map(fn ($item): array => [
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
}
