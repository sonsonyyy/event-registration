import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import NotificationController from '@/actions/App/Http/Controllers/NotificationController';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
                className="w-[min(24rem,calc(100vw-1rem))] rounded-md border border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(247,250,249,0.98),_rgba(255,255,255,1))] p-0 shadow-xl shadow-[#184d47]/10 dark:border-slate-800 dark:bg-slate-950"
            >
                <DropdownMenuLabel className="flex items-center justify-between gap-3 border-b border-[#dce4e1] bg-white/70 px-3 py-3 sm:px-4 dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="space-y-1">
                        <p className="text-[13px] font-medium text-foreground sm:text-sm">
                            Notifications
                        </p>
                        <p className="text-[11px] text-muted-foreground sm:text-xs">
                            {notifications.unread_count > 0
                                ? `${notifications.unread_count} unread`
                                : 'All caught up'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={markAllRead}
                        className={cn(
                            'inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors sm:text-xs',
                            notifications.unread_count > 0
                                ? 'cursor-pointer hover:text-foreground'
                                : 'cursor-default opacity-50',
                        )}
                    >
                        <CheckCheck className="size-3.5" />
                        Mark all read
                    </button>
                </DropdownMenuLabel>

                {notifications.recent.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[13px] text-muted-foreground sm:text-sm">
                        No notifications yet.
                    </div>
                ) : (
                    <div className="max-h-[24rem] overflow-y-auto">
                        {notifications.recent.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    openNotification(notification);
                                }}
                                className={cn(
                                    'items-start gap-3 rounded-none border-b border-[#e2ebe6] px-3 py-3 transition-colors last:border-b-0 sm:px-4',
                                    notification.read_at === null
                                        ? 'bg-[#f5faf8]'
                                        : 'bg-transparent hover:bg-white/70 dark:hover:bg-slate-950/70',
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
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                        <p
                                            className={cn(
                                                'truncate text-[13px] text-foreground sm:text-sm',
                                                notification.read_at === null
                                                    ? 'font-medium'
                                                    : 'font-normal',
                                            )}
                                        >
                                            {notification.title}
                                        </p>
                                        <span className="shrink-0 text-[10px] text-muted-foreground sm:text-[11px]">
                                            {notification.created_at
                                                ? formatSystemDateTime(notification.created_at)
                                                : ''}
                                        </span>
                                    </div>
                                    <p className="line-clamp-2 text-[11px] leading-5 text-muted-foreground sm:text-xs">
                                        {notification.message}
                                    </p>
                                    <p className="text-[10px] font-medium tracking-[0.18em] text-[#184d47] uppercase dark:text-emerald-300">
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
