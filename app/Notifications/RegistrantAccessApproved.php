<?php

namespace App\Notifications;

use App\Models\User;

class RegistrantAccessApproved extends WorkflowNotification
{
    public function __construct(public readonly User $accountRequest) {}

    protected function payload(): array
    {
        $this->accountRequest->loadMissing('pastor.section.district');

        $churchName = $this->accountRequest->pastor?->church_name ?? 'your assigned church';

        return [
            'type' => 'registrant_access_approved',
            'title' => 'Account request approved',
            'message' => sprintf('Your church access request for %s was approved.', $churchName),
            'action_url' => route('dashboard', absolute: false),
            'action_label' => 'Open dashboard',
            'related_type' => 'user',
            'related_id' => $this->accountRequest->getKey(),
            'meta' => [
                'church_name' => $churchName,
                'pastor_name' => $this->accountRequest->pastor?->pastor_name,
                'approval_status' => User::APPROVAL_APPROVED,
            ],
        ];
    }
}
