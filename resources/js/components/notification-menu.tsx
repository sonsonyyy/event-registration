import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import NotificationController from '@/actions/App/Http/Controllers/NotificationController';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatSystemDateTime } from '@/lib/date-time';
import { cn } from '@/lib/utils';
import type { NotificationCenter, WorkflowNotification } from '@/types';

export function NotificationMenu() {
    const { notifications } = usePage<{
        notifications: NotificationCenter;
    }>().props;

    const openNotification = (notification: WorkflowNotification): void => {
        const visitNotificationTarget = (): void => {
            router.visit(notification.action_url, {
                preserveScroll: true,
            });
        };

        if (notification.read_at !== null) {
            visitNotificationTarget();

            return;
        }

        router.patch(
            NotificationController.markRead.url(notification.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: visitNotificationTarget,
            },
        );
    };

    const markAllRead = (): void => {
        if (notifications.unread_count === 0) {
            return;
        }

        router.post(
            NotificationController.markAllRead.url(),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                    aria-label="Open notifications"
                >
                    <Bell className="size-4.5" />
                    {notifications.unread_count > 0 && (
                        <span className="absolute top-1.5 right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-sidebar-primary px-1 text-[10px] font-medium leading-none text-sidebar-primary-foreground">
                            {notifications.unread_count > 9 ? '9+' : notifications.unread_count}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[24rem] rounded-lg p-0"
            >
                <DropdownMenuLabel className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                            Notifications
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {notifications.unread_count > 0
                                ? `${notifications.unread_count} unread`
                                : 'All caught up'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={markAllRead}
                        className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors',
                            notifications.unread_count > 0
                                ? 'cursor-pointer hover:text-foreground'
                                : 'cursor-default opacity-50',
                        )}
                    >
                        <CheckCheck className="size-3.5" />
                        Mark all read
                    </button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-0 my-0" />

                {notifications.recent.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">
                        No notifications yet.
                    </div>
                ) : (
                    <div className="max-h-[26rem] overflow-y-auto p-1.5">
                        {notifications.recent.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    openNotification(notification);
                                }}
                                className={cn(
                                    'items-start gap-3 rounded-md px-3 py-3',
                                    notification.read_at === null
                                        ? 'bg-muted/40'
                                        : 'bg-transparent',
                                )}
                            >
                                <span
                                    className={cn(
                                        'mt-1.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full',
                                        notification.read_at === null
                                            ? 'bg-sidebar-primary'
                                            : 'bg-border',
                                    )}
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p
                                            className={cn(
                                                'truncate text-sm text-foreground',
                                                notification.read_at === null
                                                    ? 'font-medium'
                                                    : 'font-normal',
                                            )}
                                        >
                                            {notification.title}
                                        </p>
                                        <span className="shrink-0 text-[11px] text-muted-foreground">
                                            {notification.created_at
                                                ? formatSystemDateTime(notification.created_at)
                                                : ''}
                                        </span>
                                    </div>
                                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                                        {notification.message}
                                    </p>
                                    <p className="text-[11px] font-medium tracking-wide text-sidebar-primary uppercase">
                                        {notification.action_label}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
