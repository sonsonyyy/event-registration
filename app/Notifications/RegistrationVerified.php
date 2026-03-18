<?php

namespace App\Notifications;

use App\Models\Registration;

class RegistrationVerified extends WorkflowNotification
{
    public function __construct(public readonly Registration $registration) {}

    protected function payload(): array
    {
        $this->registration->loadMissing('event', 'pastor.section.district');

        return [
            'type' => 'registration_verified',
            'title' => 'Registration verified',
            'message' => sprintf(
                '%s was verified successfully.',
                $this->registration->event?->name ?? 'Your registration',
            ),
            'action_url' => route('registrations.online.index', absolute: false),
            'action_label' => 'View submissions',
            'related_type' => 'registration',
            'related_id' => $this->registration->getKey(),
            'meta' => [
                'event_name' => $this->registration->event?->name,
                'church_name' => $this->registration->pastor?->church_name,
                'payment_reference' => $this->registration->payment_reference,
                'registration_status' => Registration::STATUS_VERIFIED,
            ],
        ];
    }
}
