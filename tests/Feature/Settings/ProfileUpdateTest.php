<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/profile')
            ->has('mustVerifyEmail'));
});

test('profile information cannot be updated by the user from settings', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patch('/settings/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ])
        ->assertMethodNotAllowed();

    $user->refresh();

    expect($user->name)->not->toBe('Test User');
    expect($user->email)->not->toBe('test@example.com');
});

test('users cannot delete their own account from settings', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->delete('/settings/profile', [
            'password' => 'password',
        ])
        ->assertMethodNotAllowed();

    expect($user->fresh())->not->toBeNull();
});
