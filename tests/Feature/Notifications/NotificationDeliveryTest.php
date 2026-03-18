<?php

use App\Models\Event;
use App\Models\EventFeeCategory;
use App\Models\Pastor;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\User;
use App\Notifications\RegistrantAccessApproved;
use App\Notifications\RegistrantAccessRejected;
use App\Notifications\RegistrantAccessRequested;
use App\Notifications\RegistrationRejected;
use App\Notifications\RegistrationResubmitted;
use App\Notifications\RegistrationReturnedForCorrection;
use App\Notifications\RegistrationSubmittedForReview;
use App\Notifications\RegistrationVerified;

test('account request notifications are stored as database workflow payloads', function () {
    $pastor = Pastor::factory()->create([
        'church_name' => 'Grace Community Church',
    ]);
    $requestUser = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $pastor->section->district_id,
            'section_id' => $pastor->section_id,
            'pastor_id' => $pastor->id,
            'name' => 'Church Representative',
            'email' => 'representative@example.com',
        ]);
    $reviewer = User::factory()->admin()->create();

    $cases = [
        [
            'notification' => new RegistrantAccessRequested($requestUser),
            'type' => 'registrant_access_requested',
            'title' => 'New account request',
            'action_url' => route('account-requests.index', absolute: false),
            'action_label' => 'Review request',
        ],
        [
            'notification' => new RegistrantAccessApproved($requestUser),
            'type' => 'registrant_access_approved',
            'title' => 'Account request approved',
            'action_url' => route('dashboard', absolute: false),
            'action_label' => 'Open dashboard',
        ],
        [
            'notification' => new RegistrantAccessRejected($requestUser),
            'type' => 'registrant_access_rejected',
            'title' => 'Account request rejected',
            'action_url' => route('dashboard', absolute: false),
            'action_label' => 'View account',
        ],
    ];

    foreach ($cases as $case) {
        $channels = $case['notification']->via($reviewer);
        $broadcastMessage = $case['notification']->toBroadcast($reviewer);

        expect($channels)->toContain('database', 'broadcast')
            ->and($case['notification']->broadcastType())->toBe($case['type'])
            ->and($broadcastMessage->data['type'])->toBe($case['type'])
            ->and($broadcastMessage->data['action_url'])->toBe($case['action_url'])
            ->and($broadcastMessage->connection)->toBe('deferred');

        $reviewer->notifications()->delete();
        $reviewer->notify($case['notification']);

        $storedNotification = $reviewer->notifications()->firstOrFail();

        expect($storedNotification->data['type'])->toBe($case['type'])
            ->and($storedNotification->data['title'])->toBe($case['title'])
            ->and($storedNotification->data['action_url'])->toBe($case['action_url'])
            ->and($storedNotification->data['action_label'])->toBe($case['action_label'])
            ->and($storedNotification->data['related_type'])->toBe('user')
            ->and($storedNotification->data['related_id'])->toBe($requestUser->id)
            ->and($storedNotification->data['meta']['church_name'])->toBe('Grace Community Church');
    }
});

test('registration workflow notifications are stored as database workflow payloads', function () {
    $pastor = Pastor::factory()->create([
        'church_name' => 'Grace Community Church',
    ]);
    $registrant = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
        'name' => 'Church Representative',
    ]);
    $event = Event::factory()->create([
        'name' => 'CLD Youth Conference 2026',
        'status' => Event::STATUS_OPEN,
        'registration_open_at' => now()->subDay(),
        'registration_close_at' => now()->addDays(5),
    ]);
    $feeCategory = EventFeeCategory::factory()->for($event)->create();
    $registration = Registration::factory()
        ->for($event)
        ->for($pastor)
        ->for($registrant, 'encodedByUser')
        ->create([
            'registration_mode' => Registration::MODE_ONLINE,
            'registration_status' => Registration::STATUS_PENDING_VERIFICATION,
            'payment_reference' => 'DEP-2026-1001',
        ]);

    RegistrationItem::factory()
        ->for($registration)
        ->for($feeCategory, 'feeCategory')
        ->create();

    $reviewer = User::factory()->admin()->create();

    $cases = [
        [
            'notification' => new RegistrationSubmittedForReview($registration),
            'type' => 'registration_submitted_for_review',
            'title' => 'New registration submitted',
            'action_url' => route('registrations.verification.index', absolute: false),
            'action_label' => 'Open queue',
        ],
        [
            'notification' => new RegistrationReturnedForCorrection($registration),
            'type' => 'registration_returned_for_correction',
            'title' => 'Registration needs correction',
            'action_url' => route('registrations.online.edit', $registration, absolute: false),
            'action_label' => 'Review registration',
        ],
        [
            'notification' => new RegistrationVerified($registration),
            'type' => 'registration_verified',
            'title' => 'Registration verified',
            'action_url' => route('registrations.online.index', absolute: false),
            'action_label' => 'View submissions',
        ],
        [
            'notification' => new RegistrationRejected($registration),
            'type' => 'registration_rejected',
            'title' => 'Registration rejected',
            'action_url' => route('registrations.online.index', absolute: false),
            'action_label' => 'View submissions',
        ],
        [
            'notification' => new RegistrationResubmitted($registration),
            'type' => 'registration_resubmitted',
            'title' => 'Registration resubmitted',
            'action_url' => route('registrations.verification.index', absolute: false),
            'action_label' => 'Open queue',
        ],
    ];

    foreach ($cases as $case) {
        $channels = $case['notification']->via($reviewer);
        $broadcastMessage = $case['notification']->toBroadcast($reviewer);

        expect($channels)->toContain('database', 'broadcast')
            ->and($case['notification']->broadcastType())->toBe($case['type'])
            ->and($broadcastMessage->data['type'])->toBe($case['type'])
            ->and($broadcastMessage->data['action_url'])->toBe($case['action_url'])
            ->and($broadcastMessage->connection)->toBe('deferred');

        $reviewer->notifications()->delete();
        $reviewer->notify($case['notification']);

        $storedNotification = $reviewer->notifications()->firstOrFail();

        expect($storedNotification->data['type'])->toBe($case['type'])
            ->and($storedNotification->data['title'])->toBe($case['title'])
            ->and($storedNotification->data['action_url'])->toBe($case['action_url'])
            ->and($storedNotification->data['action_label'])->toBe($case['action_label'])
            ->and($storedNotification->data['related_type'])->toBe('registration')
            ->and($storedNotification->data['related_id'])->toBe($registration->id)
            ->and($storedNotification->data['meta']['event_name'])->toBe('CLD Youth Conference 2026')
            ->and($storedNotification->data['meta']['church_name'])->toBe('Grace Community Church');
    }
});
