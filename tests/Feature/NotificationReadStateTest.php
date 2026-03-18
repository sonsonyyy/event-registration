<?php

use App\Models\Pastor;
use App\Models\User;
use App\Notifications\RegistrantAccessApproved;
use App\Notifications\RegistrantAccessRequested;

test('users can mark one of their notifications as read', function () {
    $user = User::factory()->admin()->create();
    $pastor = Pastor::factory()->create();
    $accountRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $pastor->section->district_id,
            'section_id' => $pastor->section_id,
            'pastor_id' => $pastor->id,
        ]);

    $user->notify(new RegistrantAccessRequested($accountRequest));
    $notificationId = $user->notifications()->firstOrFail()->getKey();

    $this->actingAs($user)
        ->from(route('dashboard'))
        ->patch(route('notifications.read', $notificationId))
        ->assertRedirect(route('dashboard'));

    expect($user->fresh()->notifications()->firstOrFail()->read_at)->not->toBeNull();
});

test('users can mark all of their notifications as read', function () {
    $pastor = Pastor::factory()->create();
    $user = User::factory()->onlineRegistrant()->create([
        'district_id' => $pastor->section->district_id,
        'section_id' => $pastor->section_id,
        'pastor_id' => $pastor->id,
    ]);
    $accountRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $pastor->section->district_id,
            'section_id' => $pastor->section_id,
            'pastor_id' => $pastor->id,
        ]);

    $user->notify(new RegistrantAccessApproved($accountRequest));
    $user->notify(new RegistrantAccessRequested($accountRequest));

    $this->actingAs($user)
        ->from(route('dashboard'))
        ->post(route('notifications.read-all'))
        ->assertRedirect(route('dashboard'));

    expect($user->fresh()->unreadNotifications()->count())->toBe(0)
        ->and($user->fresh()->notifications()->count())->toBe(2);
});

test('users cannot mark another users notification as read', function () {
    $user = User::factory()->admin()->create();
    $otherUser = User::factory()->admin()->create();
    $pastor = Pastor::factory()->create();
    $accountRequest = User::factory()
        ->onlineRegistrant()
        ->selfServiceAccount()
        ->pendingApproval()
        ->create([
            'district_id' => $pastor->section->district_id,
            'section_id' => $pastor->section_id,
            'pastor_id' => $pastor->id,
        ]);

    $otherUser->notify(new RegistrantAccessRequested($accountRequest));
    $notificationId = $otherUser->notifications()->firstOrFail()->getKey();

    $this->actingAs($user)
        ->from(route('dashboard'))
        ->patch(route('notifications.read', $notificationId))
        ->assertNotFound();
});
