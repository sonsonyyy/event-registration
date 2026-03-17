import { toast as sonnerToast } from 'sonner';

export type AppToastPayload = {
    id?: number | string;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'info';
};

export const appToastDurationMs = 2000;

export const showToast = ({
    id,
    title,
    description,
    variant = 'info',
}: AppToastPayload): string | number => {
    const toastOptions = {
        id,
        description,
        dismissible: false,
        duration: appToastDurationMs,
    };

    if (variant === 'success') {
        return sonnerToast.success(title, toastOptions);
    }

    if (variant === 'error') {
        return sonnerToast.error(title, toastOptions);
    }

    return sonnerToast.info(title, toastOptions);
};
