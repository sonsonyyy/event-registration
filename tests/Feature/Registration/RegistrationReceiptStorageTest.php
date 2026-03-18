<?php

use App\Support\RegistrationReceiptStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('s3 receipt storage requires bucket and region configuration', function (string $missingKey) {
    config()->set('registration.receipts_disk', 's3');
    config()->set('filesystems.disks.s3.bucket', 'event-registration-receipts');
    config()->set('filesystems.disks.s3.region', 'ap-southeast-1');
    config()->set('filesystems.disks.s3.'.$missingKey, null);

    $storage = app(RegistrationReceiptStorage::class);

    expect(fn () => $storage->store(
        UploadedFile::fake()->create('receipt.pdf', 64, 'application/pdf'),
    ))->toThrow(
        RuntimeException::class,
        'missing required S3 configuration: '.$missingKey,
    );
})->with('missingS3ReceiptConfig');

test('local receipt storage can still store files without s3 configuration', function () {
    Storage::fake('local');
    config()->set('registration.receipts_disk', 'local');
    config()->set('filesystems.disks.s3.bucket', null);
    config()->set('filesystems.disks.s3.region', null);

    $storage = app(RegistrationReceiptStorage::class);
    $path = $storage->store(
        UploadedFile::fake()->create('receipt.pdf', 64, 'application/pdf'),
    );

    expect($path)->not->toBeEmpty();
    Storage::disk('local')->assertExists($path);
});

dataset('missingS3ReceiptConfig', ['bucket', 'region']);
