import { Head } from '@inertiajs/react';
import {
    BadgeCheck,
    Building2,
    CalendarRange,
    Clock3,
    Users,
} from 'lucide-react';
import { reviewWorkspaceStyles } from '@/components/data-table-presets';
import Heading from '@/components/heading';
import SummaryStatCards from '@/components/summary-stat-cards';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import {
    formatSystemDateRange,
    formatSystemDateTime,
} from '@/lib/date-time';
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
    description: string;
};

type DashboardEvent = {
    id: number;
    name: string;
    venue: string;
    date_from: string;
    date_to: string;
    remaining_slots: number;
    registration_close_at: string;
};

type DashboardRegistration = {
    id: number;
    event_name: string;
    church_name: string;
    registration_mode: string;
    registration_status: string;
    payment_status: string;
    submitted_at: string | null;
    total_quantity: number;
    total_amount: string;
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

const formatDateTime = (value: string | null): string => {
    if (! value) {
        return 'Not submitted';
    }

    return formatSystemDateTime(value);
};

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

const registrationStatusVariant = (
    status: string,
): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
        case 'verified':
        case 'completed':
            return 'secondary';
        case 'rejected':
        case 'cancelled':
            return 'destructive';
        default:
            return 'default';
    }
};

const paymentStatusVariant = (
    status: string,
): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
        case 'paid':
            return 'secondary';
        case 'partial':
            return 'default';
        default:
            return 'destructive';
    }
};

const registrationModeLabel = (mode: string): string =>
    mode === 'online' ? 'Online' : 'Onsite';

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
                iconWrapperClassName:
                    reviewWorkspaceStyles.summaryIconPending,
                icon: Clock3,
            };
        case 'active users':
            return {
                cardClassName: reviewWorkspaceStyles.summaryCardApproved,
                iconWrapperClassName:
                    reviewWorkspaceStyles.summaryIconApproved,
                icon: Users,
            };
        case 'active churches':
        case 'assigned churches':
            return {
                cardClassName: reviewWorkspaceStyles.summaryCardApproved,
                iconWrapperClassName:
                    reviewWorkspaceStyles.summaryIconApproved,
                icon: Building2,
            };
        case 'open events':
            return {
                cardClassName: reviewWorkspaceStyles.summaryCardApproved,
                iconWrapperClassName:
                    reviewWorkspaceStyles.summaryIconApproved,
                icon: CalendarRange,
            };
        default:
            return {
                cardClassName: reviewWorkspaceStyles.summaryCardApproved,
                iconWrapperClassName:
                    reviewWorkspaceStyles.summaryIconApproved,
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
                <Heading
                    title="Dashboard"
                    description="Event availability, account status, and recent registration activity."
                    className="mb-3"
                />

                {dashboard.account_notice && (
                    <Card className={`overflow-hidden py-0 ${noticeClassName}`}>
                        <CardContent className="p-4 sm:p-5">
                            <div className="space-y-2">
                                <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                    Account status
                                </div>
                                <div className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-slate-100 sm:text-xl">
                                    {dashboard.account_notice.title}
                                </div>
                                <p className="max-w-3xl text-[13px] leading-5 text-slate-600 dark:text-slate-300 sm:text-sm sm:leading-6">
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
                                subtitle: metric.description,
                                icon: style.icon,
                                cardClassName: style.cardClassName,
                                iconWrapperClassName:
                                    style.iconWrapperClassName,
                            };
                        })}
                    />
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                    <Card className="overflow-hidden border border-[#d3ddd8] border-t-4 border-t-[#184d47] bg-white py-0 shadow-xl shadow-[#184d47]/8">
                        <CardContent className="p-0">
                            <div className="border-b border-[#e2ebe6] px-5 py-5">
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                        Open events
                                    </div>
                                    <div className="text-xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-[1.375rem]">
                                        Available registrations
                                    </div>
                                    <p className="text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-6">
                                        Current event capacity and registration windows available from your dashboard.
                                    </p>
                                </div>
                            </div>

                            <div className="px-5 py-1.5">
                                {dashboard.open_events.length === 0 ? (
                                    <div className="py-8 text-[13px] text-slate-600 sm:text-sm">
                                        No open events are currently available.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#e2ebe6]">
                                        {dashboard.open_events.map((event) => (
                                            <div
                                                key={event.id}
                                                className="grid gap-3 py-3.5 md:grid-cols-[minmax(0,1fr)_170px] md:items-start"
                                            >
                                                <div className="space-y-1.5">
                                                    <div className="text-[15px] font-semibold text-slate-900 sm:text-base">
                                                        {event.name}
                                                    </div>
                                                    <div className="text-[13px] text-slate-600">
                                                        {formatSystemDateRange(event.date_from, event.date_to)}
                                                    </div>
                                                    <div className="text-[12px] text-slate-500 sm:text-[13px]">
                                                        {event.venue}
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 text-left md:text-right">
                                                    <div className="text-[13px] font-semibold text-[#184d47] sm:text-sm">
                                                        {event.remaining_slots} slots left
                                                    </div>
                                                    <div className="text-[12px] text-slate-500 sm:text-[13px]">
                                                        Closes {formatDateTime(event.registration_close_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border border-[#d3ddd8] border-t-4 border-t-[#184d47] bg-white py-0 shadow-xl shadow-[#184d47]/8">
                        <CardContent className="p-0">
                            <div className="border-b border-[#e2ebe6] px-5 py-5">
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                        Recent activity
                                    </div>
                                    <div className="text-xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-[1.375rem]">
                                        Latest registrations
                                    </div>
                                    <p className="text-[13px] leading-5 text-slate-600 sm:text-sm sm:leading-6">
                                        Recent registration activity visible within your access scope.
                                    </p>
                                </div>
                            </div>

                            <div className="px-5 py-1.5">
                                {dashboard.recent_registrations.length === 0 ? (
                                    <div className="py-8 text-[13px] text-slate-600 sm:text-sm">
                                        No recent registrations are available for your current scope.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#e2ebe6]">
                                        {dashboard.recent_registrations.map((registration) => (
                                            <div
                                                key={registration.id}
                                                className="space-y-2.5 py-3.5"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="text-[15px] font-semibold text-slate-900 sm:text-base">
                                                            {registration.event_name}
                                                        </div>
                                                        <div className="text-[13px] text-slate-600">
                                                            {registration.church_name}
                                                        </div>
                                                    </div>
                                                    <div className="text-[12px] text-slate-500 sm:text-[13px]">
                                                        #{registration.id}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="default">
                                                        {registrationModeLabel(registration.registration_mode)}
                                                    </Badge>
                                                    <Badge
                                                        variant={registrationStatusVariant(
                                                            registration.registration_status,
                                                        )}
                                                        className="capitalize"
                                                    >
                                                        {registration.registration_status}
                                                    </Badge>
                                                    <Badge
                                                        variant={paymentStatusVariant(
                                                            registration.payment_status,
                                                        )}
                                                        className="capitalize"
                                                    >
                                                        {registration.payment_status}
                                                    </Badge>
                                                </div>

                                                <div className="grid gap-1.5 text-[13px] text-slate-600 sm:text-sm">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span>Submitted</span>
                                                        <span className="font-medium text-slate-900">
                                                            {formatDateTime(registration.submitted_at)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span>Total quantity</span>
                                                        <span className="font-medium text-slate-900">
                                                            {registration.total_quantity}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span>Total amount</span>
                                                        <span className="font-medium text-slate-900">
                                                            {formatCurrency(registration.total_amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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
