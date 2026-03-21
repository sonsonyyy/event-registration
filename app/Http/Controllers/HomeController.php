<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Support\EventCapacity;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\RedirectResponse;

class HomeController extends Controller
{
    public function __invoke(Request $request, EventCapacity $eventCapacity): Response|RedirectResponse
    {
        if ($request->user() !== null) {
            return to_route('dashboard');
        }

        return Inertia::render('welcome', [
            'events' => fn (): array => $this->publicEvents($eventCapacity),
            'registrationFlow' => fn (): array => $this->registrationFlow(),
            'faqs' => fn (): array => $this->registrationFaqs(),
        ]);
    }

    /**
     * Build the public event listing shown on the welcome page.
     *
     * @return array<int, array<string, mixed>>
     */
    private function publicEvents(EventCapacity $eventCapacity): array
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
                    ->orderBy('amount')
                    ->orderBy('category_name'),
            ])
            ->orderBy('date_from')
            ->get()
            ->each(fn (Event $event): bool => $event->syncOperationalStatus())
            ->filter(function (Event $event) use ($eventCapacity): bool {
                if (! $event->canAcceptRegistrations()) {
                    return false;
                }

                return $eventCapacity->eventHasAvailableFeeCategories($event);
            })
            ->map(function (Event $event) use ($eventCapacity): array {
                return [
                    'id' => $event->getKey(),
                    'name' => $event->name,
                    'description' => $event->description,
                    'venue' => $event->venue,
                    'date_from' => $event->date_from->toDateString(),
                    'date_to' => $event->date_to->toDateString(),
                    'registration_close_at' => $event->registration_close_at->toIso8601String(),
                    'total_capacity' => $event->total_capacity,
                    'remaining_slots' => $eventCapacity->remainingSlotsForEvent($event),
                    'fee_categories' => $event->feeCategories
                        ->filter(fn (EventFeeCategory $feeCategory): bool => $eventCapacity->feeCategoryHasCapacity($feeCategory))
                        ->map(fn (EventFeeCategory $feeCategory): array => [
                            'id' => $feeCategory->getKey(),
                            'category_name' => $feeCategory->category_name,
                            'amount' => (string) $feeCategory->amount,
                            'remaining_slots' => $eventCapacity->remainingSlotsForFeeCategory($feeCategory),
                        ])
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Build the homepage FAQ content for the public registration flow.
     *
     * @return array<int, array{question: string, answer: string}>
     */
    private function registrationFaqs(): array
    {
        return [
            [
                'question' => 'How do I request a registrant account for our church?',
                'answer' => 'Open the church representative access link and submit the representative name, section, pastor or church assignment, and password for the account request. Each church may have up to two registrant accounts.',
            ],
            [
                'question' => 'Who approves registrant account requests?',
                'answer' => 'Authorized reviewers using manager or admin access review and approve registrant account requests based on their assigned scope.',
            ],
            [
                'question' => 'When can I submit an online registration?',
                'answer' => 'You may sign in after creating the account, but online registration becomes available only after the account request has been approved.',
            ],
            [
                'question' => 'What is required when submitting an online registration?',
                'answer' => 'Select an open event, enter the required fee-category quantities, then provide the receipt or reference number and upload proof of payment as an image file or PDF before submitting.',
            ],
            [
                'question' => 'How do I know when the registration process is complete?',
                'answer' => 'Monitor the submitted registrations in your account dashboard. Once an authorized reviewer verifies the submission, the registration is complete.',
            ],
        ];
    }

    /**
     * Build the easy-to-follow homepage steps for public registration.
     *
     * @return array<int, array{eyebrow: string, title: string, description: string}>
     */
    private function registrationFlow(): array
    {
        return [
            [
                'eyebrow' => 'Step 1',
                'title' => 'Request a registrant account',
                'description' => 'Use the church representative access link and submit the assigned section, pastor, church, and account password. Each church may maintain up to two registrant accounts.',
            ],
            [
                'eyebrow' => 'Step 2',
                'title' => 'Wait for account approval',
                'description' => 'An authorized reviewer with the proper scope reviews the account request before online registration is unlocked.',
            ],
            [
                'eyebrow' => 'Step 3',
                'title' => 'Submit the event registration',
                'description' => 'Choose an open event, add fee-category quantities, and provide the payment reference number with proof of payment.',
            ],
            [
                'eyebrow' => 'Step 4',
                'title' => 'Monitor verification',
                'description' => 'Track the submission in the account dashboard while authorized reviewers check the receipt and transaction details.',
            ],
            [
                'eyebrow' => 'Step 5',
                'title' => 'Complete once verified',
                'description' => 'When the registration status becomes verified, the church registration is complete for that event.',
            ],
        ];
    }
}
