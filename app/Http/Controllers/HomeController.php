<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventFeeCategory;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('welcome', [
            'events' => $this->publicEvents(),
            'faqs' => $this->registrationFaqs(),
        ]);
    }

    /**
     * Build the public event listing shown on the welcome page.
     *
     * @return array<int, array<string, mixed>>
     */
    private function publicEvents(): array
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
                    'description' => $event->description,
                    'venue' => $event->venue,
                    'date_from' => $event->date_from->toDateString(),
                    'date_to' => $event->date_to->toDateString(),
                    'registration_close_at' => $event->registration_close_at->toIso8601String(),
                    'total_capacity' => $event->total_capacity,
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
     * Build the homepage FAQ content for the public registration flow.
     *
     * @return array<int, array{question: string, answer: string}>
     */
    private function registrationFaqs(): array
    {
        return [
            [
                'question' => 'How do I request a registrant account for our church?',
                'answer' => 'Open the church representative access link and submit the representative name, district, section, pastor or church assignment, and password for the account request.',
            ],
            [
                'question' => 'Who approves registrant account requests?',
                'answer' => 'Youth officials using a manager account review and approve registrant account requests based on their assigned section scope.',
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
                'answer' => 'Monitor the submitted registrations in your account dashboard. Once a youth official verifies the submission, the registration is complete.',
            ],
        ];
    }
}
