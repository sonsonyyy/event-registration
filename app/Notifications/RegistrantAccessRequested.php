<?php

namespace App\Notifications;

use App\Models\User;

class RegistrantAccessRequested extends WorkflowNotification
{
    public function __construct(public readonly User $accountRequest) {}

    protected function payload(): array
    {
        $this->accountRequest->loadMissing('pastor.section.district');

        $churchName = $this->accountRequest->pastor?->church_name ?? 'Unknown church';

        return [
            'type' => 'registrant_access_requested',
            'title' => 'New account request',
            'message' => sprintf('%s requested church access for %s.', $this->accountRequest->name, $churchName),
            'action_url' => route('account-requests.index', absolute: false),
            'action_label' => 'Review request',
            'related_type' => 'user',
            'related_id' => $this->accountRequest->getKey(),
            'meta' => [
                'requester_name' => $this->accountRequest->name,
                'requester_email' => $this->accountRequest->email,
                'church_name' => $churchName,
                'pastor_name' => $this->accountRequest->pastor?->pastor_name,
                'section_name' => $this->accountRequest->pastor?->section?->name,
                'district_name' => $this->accountRequest->pastor?->section?->district?->name,
                'approval_status' => $this->accountRequest->approval_status,
            ],
        ];
    }
}
