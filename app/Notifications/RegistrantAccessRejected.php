<?php

namespace App\Notifications;

use App\Models\User;

class RegistrantAccessRejected extends WorkflowNotification
{
    public function __construct(public readonly User $accountRequest) {}

    protected function payload(): array
    {
        $this->accountRequest->loadMissing('pastor.section.district');

        $churchName = $this->accountRequest->pastor?->church_name ?? 'your assigned church';

        return [
            'type' => 'registrant_access_rejected',
            'title' => 'Account request rejected',
            'message' => sprintf('Your church access request for %s was rejected.', $churchName),
            'action_url' => route('dashboard', absolute: false),
            'action_label' => 'View account',
            'related_type' => 'user',
            'related_id' => $this->accountRequest->getKey(),
            'meta' => [
                'church_name' => $churchName,
                'pastor_name' => $this->accountRequest->pastor?->pastor_name,
                'approval_status' => User::APPROVAL_REJECTED,
            ],
        ];
    }
}
