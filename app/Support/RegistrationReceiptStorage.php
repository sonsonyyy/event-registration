<?php

namespace App\Support;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\Response;

class RegistrationReceiptStorage
{
    public function diskName(): string
    {
        return (string) config('registration.receipts_disk');
    }

    public function store(UploadedFile $receipt): string
    {
        $directory = trim((string) config('registration.receipt_directory'), '/');
        $destination = $directory.'/'.now()->format('Y/m');

        return $receipt->store($destination, $this->diskName());
    }

    public function delete(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        Storage::disk($this->diskName())->delete($path);
    }

    public function exists(string $path): bool
    {
        return Storage::disk($this->diskName())->exists($path);
    }

    public function receiptResponse(string $path, ?string $originalName): Response
    {
        $disk = Storage::disk($this->diskName());
        $downloadName = $originalName ?: basename($path);

        if ($this->usesTemporaryUrlRedirects() && $disk->providesTemporaryUrls()) {
            return $this->temporaryUrlRedirect($path, $downloadName);
        }

        return $disk->response($path, $downloadName);
    }

    private function usesTemporaryUrlRedirects(): bool
    {
        return config('filesystems.disks.'.$this->diskName().'.driver') === 's3';
    }

    private function temporaryUrlRedirect(string $path, string $downloadName): RedirectResponse
    {
        $temporaryUrl = Storage::disk($this->diskName())->temporaryUrl(
            $path,
            now()->addMinutes($this->temporaryUrlTtlMinutes()),
            $this->temporaryUrlOptions($path, $downloadName),
        );

        return redirect()->away($temporaryUrl);
    }

    /**
     * @return array<string, string>
     */
    private function temporaryUrlOptions(string $path, string $downloadName): array
    {
        $options = [
            'ResponseContentDisposition' => HeaderUtils::makeDisposition(
                HeaderUtils::DISPOSITION_INLINE,
                $downloadName,
            ),
        ];

        $mimeType = Storage::disk($this->diskName())->mimeType($path);

        if (is_string($mimeType) && $mimeType !== '') {
            $options['ResponseContentType'] = $mimeType;
        }

        return $options;
    }

    private function temporaryUrlTtlMinutes(): int
    {
        return max((int) config('registration.receipt_temporary_url_ttl_minutes', 5), 1);
    }
}
