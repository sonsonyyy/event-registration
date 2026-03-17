import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { showToast, type AppToastPayload } from '@/lib/toast';

type FlashToasterProps = {
    includeStatus?: boolean;
};

type InertiaFlashEventPayload = {
    toasts?: Array<
        AppToastPayload & {
            key?: string;
        }
    >;
};

const processedInertiaToastKeys = new Set<string>();

export default function FlashToaster({
    includeStatus: _includeStatus = false,
}: FlashToasterProps) {
    const page = usePage();

    useEffect(() => {
        const queueInertiaFlashToasts = (flash: InertiaFlashEventPayload): void => {
            const flashToasts = Array.isArray(flash.toasts) ? flash.toasts : [];

            if (flashToasts.length === 0) {
                return;
            }

            flashToasts.forEach((toast) => {
                if (typeof toast.title !== 'string' || toast.title.trim() === '') {
                    return;
                }

                const toastKey =
                    toast.key
                    ?? `${toast.variant ?? 'info'}:${toast.title}:${toast.description ?? ''}`;

                if (processedInertiaToastKeys.has(toastKey)) {
                    return;
                }

                processedInertiaToastKeys.add(toastKey);

                showToast({
                    id: toastKey,
                    variant: toast.variant ?? 'info',
                    title: toast.title,
                    description: toast.description,
                });
            });
        };

        queueInertiaFlashToasts(page.flash as InertiaFlashEventPayload);

        const handleInertiaFlash = (event: Event): void => {
            const detail = (event as CustomEvent<{ flash: InertiaFlashEventPayload }>)
                .detail;

            queueInertiaFlashToasts(detail.flash);
        };

        window.addEventListener(
            'inertia:flash',
            handleInertiaFlash as EventListener,
        );

        return () => {
            window.removeEventListener(
                'inertia:flash',
                handleInertiaFlash as EventListener,
            );
        };
    }, [page.flash]);

    return <Toaster />;
}
