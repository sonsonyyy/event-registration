import { useEchoNotification } from '@laravel/echo-react';
import { router, usePage } from '@inertiajs/react';
import { startTransition, useEffectEvent } from 'react';
import type { Auth } from '@/types';

function RealtimeNotificationSubscription({
    channelName,
}: {
    channelName: string;
}) {
    const refreshNotifications = useEffectEvent((): void => {
        startTransition(() => {
            router.reload({
                only: ['notifications'],
            });
        });
    });

    useEchoNotification(channelName, () => {
        refreshNotifications();
    });

    return null;
}

export function NotificationListener() {
    const { auth } = usePage<{ auth: Auth }>().props;

    if (!import.meta.env.VITE_REVERB_APP_KEY) {
        return null;
    }

    return (
        <RealtimeNotificationSubscription
            channelName={`App.Models.User.${auth.user.id}`}
        />
    );
}
