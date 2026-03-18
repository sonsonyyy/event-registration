<?php

namespace App\Notifications;

use App\Models\Registration;

class RegistrationReturnedForCorrection extends WorkflowNotification
{
    public function __construct(public readonly Registration $registration) {}

    protected function payload(): array
    {
        $this->registration->loadMissing('event', 'pastor.section.district');

        return [
            'type' => 'registration_returned_for_correction',
            'title' => 'Registration needs correction',
            'message' => sprintf(
                '%s was returned for correction.',
                $this->registration->event?->name ?? 'Your registration',
            ),
            'action_url' => route('registrations.online.edit', $this->registration, absolute: false),
            'action_label' => 'Review registration',
            'related_type' => 'registration',
            'related_id' => $this->registration->getKey(),
            'meta' => [
                'event_name' => $this->registration->event?->name,
                'church_name' => $this->registration->pastor?->church_name,
                'payment_reference' => $this->registration->payment_reference,
                'registration_status' => Registration::STATUS_NEEDS_CORRECTION,
            ],
        ];
    }
}
