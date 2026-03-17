import { useEffect, useRef } from 'react';
import { showToast } from '@/lib/toast';

type ActionStatusToastProps = {
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'info';
};

export default function ActionStatusToast({
    show,
    title,
    description,
    variant = 'success',
}: ActionStatusToastProps) {
    const hasShownRef = useRef(false);

    useEffect(() => {
        if (!show) {
            hasShownRef.current = false;
            return;
        }

        if (hasShownRef.current) {
            return;
        }

        hasShownRef.current = true;

        showToast({
            title,
            description,
            variant,
        });
    }, [description, show, title, variant]);

    return null;
}
