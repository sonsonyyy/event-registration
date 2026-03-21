<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    @php
        $appEnvironment = config('app.env');
        $environmentBanner = match ($appEnvironment) {
            'staging' => [
                'label' => 'Staging',
                'class' => 'border-b border-amber-200 bg-[linear-gradient(90deg,_#fff5db,_#ffe9b8)] text-amber-950',
            ],
            'local', 'development' => [
                'label' => 'Development',
                'class' => 'border-b border-sky-200 bg-[linear-gradient(90deg,_#e5f3ff,_#d8ebff)] text-sky-950',
            ],
            default => null,
        };
    @endphp
    <body
        class="font-sans antialiased"
        style="--app-env-banner-height: {{ $environmentBanner !== null ? '40px' : '0px' }};"
    >
        @if ($environmentBanner !== null)
            <div class="{{ $environmentBanner['class'] }}">
                <div class="mx-auto flex min-h-10 w-full max-w-7xl items-center justify-center px-4 py-2 text-center text-[11px] font-semibold tracking-[0.18em] uppercase sm:text-xs">
                    {{ $environmentBanner['label'] }} Environment
                </div>
            </div>
        @endif
        @inertia
    </body>
</html>
