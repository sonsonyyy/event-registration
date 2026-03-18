import type { Auth, NotificationCenter } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            appVersion: string;
            auth: Auth;
            notifications: NotificationCenter;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
