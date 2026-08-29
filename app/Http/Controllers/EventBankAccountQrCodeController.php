<?php

namespace App\Http\Controllers;

use App\Models\EventBankAccount;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class EventBankAccountQrCodeController extends Controller
{
    public function __invoke(EventBankAccount $eventBankAccount): Response
    {
        if ($eventBankAccount->qr_code_path === null) {
            abort(404);
        }

        $disk = Storage::disk(EventBankAccount::qrCodeDiskName());

        if (! $disk->exists($eventBankAccount->qr_code_path)) {
            abort(404);
        }

        return $disk->response(
            $eventBankAccount->qr_code_path,
            $eventBankAccount->qr_code_original_name ?: basename($eventBankAccount->qr_code_path),
            [
                'Cache-Control' => 'public, max-age=86400',
            ],
        );
    }
}
