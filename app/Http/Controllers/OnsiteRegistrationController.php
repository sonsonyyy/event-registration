<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOnsiteRegistrationRequest;
use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OnsiteRegistrationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAnyOnsite', Registration::class);

        $user = $request->user();
        $registrations = Registration::query()
            ->where('registration_mode', Registration::MODE_ONSITE)
            ->with([
                'encodedByUser',
                'event',
                'items.feeCategory',
                'pastor.section.district',
            ])
            ->withSum('items as total_quantity', 'quantity')
            ->withSum('items as total_amount', 'subtotal_amount')
            ->latest('submitted_at')
            ->latest('id');

        if ($user?->isManager()) {
            $registrations->whereHas('pastor', function ($query) use ($user): void {
                $query->where('section_id', $user->section_id);
            });
        }

        if ($user?->isRegistrationStaff()) {
            $registrations->where('encoded_by_user_id', $user->getKey());
        }

        return Inertia::render('registrations/onsite/index', [
            'registrations' => $registrations
                ->get()
                ->map(fn (Registration $registration): array => $this->registrationData($registration))
                ->values(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request): Response
    {
        Gate::authorize('createOnsite', [Registration::class, null]);

        return Inertia::render('registrations/onsite/create', [
            'events' => $this->eventOptions(),
            'pastors' => $this->pastorOptions($request->user()),
            'paymentStatusOptions' => $this->paymentStatusOptions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreOnsiteRegistrationRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $registrationId = DB::transaction(function () use ($request, $validated): int {
            $event = Event::query()
                ->lockForUpdate()
                ->findOrFail($validated['event_id']);
            $event->loadSum('reservedRegistrationItems as reserved_quantity', 'quantity');
            $event->syncOperationalStatus();

            if (! $event->canAcceptRegistrations()) {
                throw ValidationException::withMessages([
                    'event_id' => 'The selected event is not open for onsite registration.',
                ]);
            }

            $pastor = Pastor::query()->findOrFail($validated['pastor_id']);
            Gate::authorize('createOnsite', [Registration::class, $pastor]);

            if ($pastor->status !== 'active') {
                throw ValidationException::withMessages([
                    'pastor_id' => 'The selected pastor must be active.',
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
                'registration_mode' => Registration::MODE_ONSITE,
                'payment_status' => $validated['payment_status'],
                'registration_status' => Registration::STATUS_COMPLETED,
                'payment_reference' => $validated['payment_reference'] ?: null,
                'remarks' => $validated['remarks'] ?: null,
                'submitted_at' => now(),
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

        return to_route('registrations.onsite.index')
            ->with('success', "Onsite registration #{$registrationId} saved successfully.");
    }

    /**
     * Build the event options available to onsite registration users.
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
                        ->values(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Build the pastor options available to the current user.
     *
     * @return array<int, array<string, mixed>>
     */
    private function pastorOptions(?User $user): array
    {
        $pastors = Pastor::query()
            ->where('status', 'active')
            ->with('section.district')
            ->orderBy('church_name');

        if ($user?->isManager()) {
            $pastors->where('section_id', $user->section_id);
        }

        return $pastors
            ->get()
            ->map(fn (Pastor $pastor): array => [
                'id' => $pastor->getKey(),
                'pastor_name' => $pastor->pastor_name,
                'church_name' => $pastor->church_name,
                'section_name' => $pastor->section->name,
                'district_name' => $pastor->section->district->name,
            ])
            ->values()
            ->all();
    }

    /**
     * Build the supported payment status options.
     *
     * @return array<int, array<string, string>>
     */
    private function paymentStatusOptions(): array
    {
        return collect(Registration::paymentStatuses())
            ->map(fn (string $status): array => [
                'value' => $status,
                'label' => ucfirst($status),
            ])
            ->values()
            ->all();
    }

    /**
     * Ensure the selected fee categories still satisfy event and category capacity.
     *
     * @param  Collection<int, EventFeeCategory>  $feeCategories
     * @param  Collection<int, array<string, mixed>>  $lineItems
     */
    private function guardLineItems(Event $event, Collection $feeCategories, Collection $lineItems): void
    {
        $errors = [];
        $totalQuantity = 0;

        $lineItems->each(function (array $lineItem, int $index) use ($feeCategories, &$errors, &$totalQuantity): void {
            /** @var EventFeeCategory|null $feeCategory */
            $feeCategory = $feeCategories->get((int) $lineItem['fee_category_id']);
            $quantity = (int) $lineItem['quantity'];

            if ($feeCategory === null) {
                $errors["line_items.{$index}.fee_category_id"] = 'Select a valid fee category for the chosen event.';

                return;
            }

            if ($feeCategory->status !== 'active') {
                $errors["line_items.{$index}.fee_category_id"] = 'The selected fee category is not active.';
            }

            $remainingSlots = $feeCategory->remainingSlots();

            if ($remainingSlots !== null && $quantity > $remainingSlots) {
                $errors["line_items.{$index}.quantity"] = 'The selected fee category does not have enough remaining slots.';
            }

            $totalQuantity += $quantity;
        });

        if ($totalQuantity > $event->remainingSlots()) {
            $errors['line_items'] = 'The requested quantity exceeds the remaining event capacity.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * Transform an onsite registration for the index page.
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
            'encoded_by' => [
                'id' => $registration->encodedByUser->getKey(),
                'name' => $registration->encodedByUser->name,
            ],
            'items' => $registration->items
                ->map(fn (RegistrationItem $item): array => [
                    'id' => $item->getKey(),
                    'category_name' => $item->feeCategory->category_name,
                    'quantity' => $item->quantity,
                    'unit_amount' => (string) $item->unit_amount,
                    'subtotal_amount' => (string) $item->subtotal_amount,
                ])
                ->values(),
        ];
    }
}
