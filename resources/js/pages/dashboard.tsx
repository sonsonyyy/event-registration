import { Head } from '@inertiajs/react';
import {
    BadgeCheck,
    Building2,
    CalendarRange,
    Clock3,
    Users,
} from 'lucide-react';
import { reviewWorkspaceStyles } from '@/components/data-table-presets';
import SummaryStatCards from '@/components/summary-stat-cards';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatSystemDateRange } from '@/lib/date-time';
import { dashboard as dashboardRoute } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboardRoute(),
    },
];

type DashboardMetric = {
    label: string;
    value: number;
};

type DashboardEvent = {
    id: number;
    name: string;
    date_from: string;
    date_to: string;
    remaining_slots: number;
};

type DashboardRegistration = {
    id: number;
    event_name: string;
    church_name: string;
    registration_mode: string;
    registration_status: string;
};

type Props = {
    dashboard: {
        account_notice: {
            status: string;
            title: string;
            description: string;
        } | null;
        links: {
            open_events: {
                label: string;
                href: string;
            };
            recent_activity: {
                label: string;
                href: string;
            };
        };
        metrics: DashboardMetric[];
        open_events: DashboardEvent[];
        recent_registrations: DashboardRegistration[];
    };
};

const registrationStatusLabel = (status: string): string =>
    status
        .replaceAll('_', ' ')
        .replace(/^\w/, (character) => character.toUpperCase());

const registrationStatusBadgeClassName = (status: string): string => {
    switch (status) {
        case 'verified':
        case 'completed':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300';
        case 'rejected':
        case 'cancelled':
            return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300';
        default:
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300';
    }
};

const registrationModeLabel = (mode: string): string =>
    mode === 'online' ? 'Online' : 'Onsite';

const registrationModeBadgeClassName = (mode: string): string =>
    mode === 'online'
        ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300'
        : 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/40 dark:text-indigo-300';

const dashboardPanelClassName =
    'overflow-hidden border border-[#d9e4df] bg-white py-0 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-950';

const dashboardPanelHeaderClassName =
    'border-b border-[#e5eee9] bg-[#f8fbf9] px-4 py-3.5 sm:px-5 dark:border-slate-800 dark:bg-slate-900/60';

const metricCardAppearance = (
    label: string,
): {
    cardClassName: string;
    iconWrapperClassName: string;
    icon: typeof CalendarRange;
} => {
    switch (label.toLowerCase()) {
        case 'pending verification':
            return {
                cardClassName: reviewWorkspaceStyles.summaryCardPending,
                iconWrapperClassName: reviewWorkspaceStyles.summaryIconPending,
                icon: Clock3,
            };
        case 'active users':
            return {
                cardClassName: reviewWorkspaceStyles.summaryCardApproved,
                iconWrapperClassName: reviewWorkspaceStyles.summaryIconApproved,
                icon: Users,
            };
        case 'active churches':
        case 'assigned churches':
            return {
                cardClassName: reviewWorkspaceStyles.summaryCardApproved,
                iconWrapperClassName: reviewWorkspaceStyles.summaryIconApproved,
                icon: Building2,
            };
        case 'open events':
            return {
                cardClassName: reviewWorkspaceStyles.summaryCardApproved,
                iconWrapperClassName: reviewWorkspaceStyles.summaryIconApproved,
                icon: CalendarRange,
            };
        default:
            return {
                cardClassName: reviewWorkspaceStyles.summaryCardApproved,
                iconWrapperClassName: reviewWorkspaceStyles.summaryIconApproved,
                icon: BadgeCheck,
            };
    }
};

export default function Dashboard({ dashboard }: Props) {
    const noticeClassName =
        dashboard.account_notice?.status === 'rejected'
            ? 'border border-rose-200 border-t-4 border-t-rose-500 bg-white shadow-sm dark:border-rose-950/60 dark:border-t-rose-500 dark:bg-slate-950'
            : 'border border-amber-200 border-t-4 border-t-amber-500 bg-white shadow-sm dark:border-amber-950/60 dark:border-t-amber-500 dark:bg-slate-950';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-5">
                {dashboard.account_notice && (
                    <Card className={`overflow-hidden py-0 ${noticeClassName}`}>
                        <CardContent className="p-4 sm:p-5">
                            <div className="space-y-2">
                                <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                    Account status
                                </div>
                                <div className="text-lg font-semibold tracking-[-0.03em] text-slate-900 sm:text-xl dark:text-slate-100">
                                    {dashboard.account_notice.title}
                                </div>
                                <p className="max-w-3xl text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-6 dark:text-slate-300">
                                    {dashboard.account_notice.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryStatCards
                        gridClassName="contents"
                        items={dashboard.metrics.map((metric) => {
                            const style = metricCardAppearance(metric.label);

                            return {
                                title: metric.label,
                                value: metric.value,
                                icon: style.icon,
                                cardClassName: style.cardClassName,
                                iconWrapperClassName:
                                    style.iconWrapperClassName,
                            };
                        })}
                    />
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                    <Card className={dashboardPanelClassName}>
                        <CardContent className="p-0">
                            <div className={dashboardPanelHeaderClassName}>
                                <div className="space-y-1">
                                    <div className="text-[11px] font-semibold tracking-[0.14em] text-[#55706a] uppercase dark:text-slate-400">
                                        Open events
                                    </div>
                                    <div className="text-base/6 font-semibold text-slate-900 sm:text-[17px]/6 dark:text-slate-100">
                                        Available registrations
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-1 sm:px-5">
                                {dashboard.open_events.length === 0 ? (
                                    <div className="py-6 text-xs/5 text-slate-600 sm:text-[13px]/5 dark:text-slate-300">
                                        No open events are currently available.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#e5eee9] dark:divide-slate-800">
                                        {dashboard.open_events.map((event) => (
                                            <div
                                                key={event.id}
                                                className="grid gap-2 py-2.5 md:grid-cols-[minmax(0,1fr)_120px] md:items-start"
                                            >
                                                <div className="space-y-0.5">
                                                    <div className="text-sm/5 font-semibold text-slate-900 sm:text-[15px]/5 dark:text-slate-100">
                                                        {event.name}
                                                    </div>
                                                    <div className="text-xs/5 text-slate-600 dark:text-slate-300">
                                                        {formatSystemDateRange(
                                                            event.date_from,
                                                            event.date_to,
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-left md:text-right">
                                                    <div className="text-xs/5 font-semibold text-[#184d47] sm:text-[13px]/5 dark:text-emerald-300">
                                                        {event.remaining_slots}{' '}
                                                        slots left
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={dashboardPanelClassName}>
                        <CardContent className="p-0">
                            <div className={dashboardPanelHeaderClassName}>
                                <div className="space-y-1">
                                    <div className="text-[11px] font-semibold tracking-[0.14em] text-[#55706a] uppercase dark:text-slate-400">
                                        Recent activity
                                    </div>
                                    <div className="text-base/6 font-semibold text-slate-900 sm:text-[17px]/6 dark:text-slate-100">
                                        Latest registrations
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-1 sm:px-5">
                                {dashboard.recent_registrations.length === 0 ? (
                                    <div className="py-6 text-xs/5 text-slate-600 sm:text-[13px]/5 dark:text-slate-300">
                                        No recent registrations are available
                                        for your current scope.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#e5eee9] dark:divide-slate-800">
                                        {dashboard.recent_registrations.map(
                                            (registration) => (
                                                <div
                                                    key={registration.id}
                                                    className="space-y-2 py-2.5"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="space-y-0.5">
                                                            <div className="text-sm/5 font-semibold text-slate-900 sm:text-[15px]/5 dark:text-slate-100">
                                                                {
                                                                    registration.event_name
                                                                }
                                                            </div>
                                                            <div className="text-xs/5 text-slate-600 dark:text-slate-300">
                                                                {
                                                                    registration.church_name
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="text-xs/5 text-slate-500 dark:text-slate-400">
                                                            #{registration.id}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={registrationModeBadgeClassName(
                                                                registration.registration_mode,
                                                            )}
                                                        >
                                                            {registrationModeLabel(
                                                                registration.registration_mode,
                                                            )}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className={registrationStatusBadgeClassName(
                                                                registration.registration_status,
                                                            )}
                                                        >
                                                            {registrationStatusLabel(
                                                                registration.registration_status,
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
