<?php

use App\Models\EventBankAccount;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

it('serves event bank account qr code images through an application route', function (): void {
    Storage::fake('public');

    $path = 'event-bank-qr-codes/test/gcash.png';
    Storage::disk('public')->put($path, 'qr-code-image');

    $bankAccount = EventBankAccount::factory()->create([
        'qr_code_path' => $path,
        'qr_code_original_name' => 'gcash.png',
    ]);

    $response = actingAs(User::factory()->create())
        ->get(route('event-bank-accounts.qr-code', $bankAccount));

    $response->assertOk();

    expect($response->streamedContent())->toContain('qr-code-image');
    expect($response->headers->get('cache-control'))
        ->toContain('public')
        ->toContain('max-age=86400');
});

it('returns not found when a bank account qr code file is missing', function (): void {
    Storage::fake('public');

    $bankAccount = EventBankAccount::factory()->create([
        'qr_code_path' => 'event-bank-qr-codes/test/missing.png',
        'qr_code_original_name' => 'missing.png',
    ]);

    actingAs(User::factory()->create())
        ->get(route('event-bank-accounts.qr-code', $bankAccount))
        ->assertNotFound();
});
