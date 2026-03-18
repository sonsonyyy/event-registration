<?php

namespace App\Notifications;

use App\Models\Registration;

class RegistrationResubmitted extends WorkflowNotification
{
    public function __construct(public readonly Registration $registration) {}

    protected function payload(): array
    {
        $this->registration->loadMissing('event', 'pastor.section.district', 'encodedByUser');

        return [
            'type' => 'registration_resubmitted',
            'title' => 'Registration resubmitted',
            'message' => sprintf(
                '%s resubmitted %s for review.',
                $this->registration->pastor?->church_name ?? 'A church',
                $this->registration->event?->name ?? 'an event',
            ),
            'action_url' => route('registrations.verification.index', absolute: false),
            'action_label' => 'Open queue',
            'related_type' => 'registration',
            'related_id' => $this->registration->getKey(),
            'meta' => [
                'event_name' => $this->registration->event?->name,
                'church_name' => $this->registration->pastor?->church_name,
                'payment_reference' => $this->registration->payment_reference,
                'submitted_by_name' => $this->registration->encodedByUser?->name,
                'registration_status' => $this->registration->registration_status,
            ],
        ];
    }
}
