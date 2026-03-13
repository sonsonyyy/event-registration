<?php

use App\Models\User;

test('two factor settings page is not available', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/two-factor')
        ->assertNotFound();
});

test('guests cannot access the disabled two factor settings page', function () {
    $this->get('/settings/two-factor')->assertNotFound();
});
