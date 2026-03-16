import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    formatSystemDateRange,
    formatSystemDateTime,
} from '@/lib/date-time';
import AppLayout from '@/layouts/app-layout';
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

type ScopeItem = {
    label: string;
    value: string;
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
        role_name: string | null;
        hero: {
            eyebrow: string;
            title: string;
            description: string;
        };
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
        scope: {
            title: string;
            summary: string;
            description: string;
            items: ScopeItem[];
        };
        metrics: DashboardMetric[];
        open_events: DashboardEvent[];
        recent_registrations: DashboardRegistration[];
    };
};

const metricCardClasses = [
    {
        card: 'border border-[#d6e2de] border-t-4 border-t-[#184d47] bg-[linear-gradient(145deg,_rgba(24,77,71,0.10),_rgba(255,255,255,0.98))] shadow-[#184d47]/8',
        label: 'text-slate-600',
        value: 'text-slate-900',
        description: 'text-slate-600',
    },
    {
        card: 'border border-[#d9e2de] border-t-4 border-t-slate-900 bg-white shadow-[#184d47]/6',
        label: 'text-slate-600',
        value: 'text-slate-900',
        description: 'text-slate-600',
    },
    {
        card: 'border border-[#d9e2de] border-t-4 border-t-slate-900 bg-white shadow-[#184d47]/6',
        label: 'text-slate-600',
        value: 'text-slate-900',
        description: 'text-slate-600',
    },
    {
        card: 'border border-[#184d47]/20 border-t-4 border-t-[#8bc4b5] bg-[#184d47] text-white shadow-[#184d47]/20',
        label: 'text-white/75',
        value: 'text-white',
        description: 'text-white/75',
    },
];

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

export default function Dashboard({ dashboard }: Props) {
    const noticeClassName =
        dashboard.account_notice?.status === 'rejected'
            ? 'border border-rose-200 border-t-4 border-t-rose-500 bg-white shadow-sm dark:border-rose-950/60 dark:border-t-rose-500 dark:bg-slate-950'
            : 'border border-amber-200 border-t-4 border-t-amber-500 bg-white shadow-sm dark:border-amber-950/60 dark:border-t-amber-500 dark:bg-slate-950';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Dashboard"
                    description="Role-aware overview of event availability, scope, and recent registration activity."
                    className="mb-4"
                />

                {dashboard.account_notice && (
                    <Card className={`overflow-hidden py-0 ${noticeClassName}`}>
                        <CardContent className="p-5">
                            <div className="space-y-2">
                                <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                    Account status
                                </div>
                                <div className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
                                    {dashboard.account_notice.title}
                                </div>
                                <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    {dashboard.account_notice.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
                    <Card className="overflow-hidden border border-[#29544e] border-t-4 border-t-[#8bc4b5] bg-[#123630] py-0 text-white shadow-2xl shadow-[#123630]/20">
                        <CardContent className="p-6 sm:p-8">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <Badge className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-white uppercase hover:bg-white/10">
                                        {dashboard.role_name ?? 'Dashboard'}
                                    </Badge>
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold tracking-[0.18em] text-[#b6d6cd] uppercase">
                                            {dashboard.hero.eyebrow}
                                        </div>
                                        <h2 className="max-w-3xl text-3xl font-extrabold tracking-[-0.04em] text-balance sm:text-4xl">
                                            {dashboard.hero.title}
                                        </h2>
                                        <p className="max-w-2xl text-sm leading-7 text-[#d3e5df] sm:text-base">
                                            {dashboard.hero.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border border-[#d3ddd8] border-t-4 border-t-[#184d47] bg-white py-0 shadow-xl shadow-[#184d47]/8">
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                        {dashboard.scope.title}
                                    </div>
                                    <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
                                        {dashboard.scope.summary}
                                    </div>
                                    <p className="text-sm leading-6 text-slate-600">
                                        {dashboard.scope.description}
                                    </p>
                                </div>

                                <div className="divide-y divide-[#e2ebe6]">
                                    {dashboard.scope.items.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                                {item.label}
                                            </div>
                                            <div className="text-right text-sm font-semibold text-slate-900">
                                                {item.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {dashboard.metrics.map((metric, index) => {
                        const style =
                            metricCardClasses[index] ??
                            metricCardClasses[metricCardClasses.length - 1];

                        return (
                            <Card
                                key={metric.label}
                                className={`overflow-hidden rounded-md py-0 shadow-sm ${style.card}`}
                            >
                                <CardContent className="p-5">
                                    <div className={`text-sm font-medium ${style.label}`}>
                                        {metric.label}
                                    </div>
                                    <div className={`mt-5 text-3xl font-semibold ${style.value}`}>
                                        {metric.value}
                                    </div>
                                    <div className={`mt-2 text-sm ${style.description}`}>
                                        {metric.description}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                    <Card className="overflow-hidden border border-[#d3ddd8] border-t-4 border-t-[#184d47] bg-white py-0 shadow-xl shadow-[#184d47]/8">
                        <CardContent className="p-0">
                            <div className="border-b border-[#e2ebe6] px-6 py-6">
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                        Open events
                                    </div>
                                    <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
                                        Available registrations
                                    </div>
                                    <p className="text-sm leading-6 text-slate-600">
                                        Current event capacity and registration windows available from your dashboard.
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 py-2">
                                {dashboard.open_events.length === 0 ? (
                                    <div className="py-10 text-sm text-slate-600">
                                        No open events are currently available.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#e2ebe6]">
                                        {dashboard.open_events.map((event) => (
                                            <div
                                                key={event.id}
                                                className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_180px] md:items-start"
                                            >
                                                <div className="space-y-2">
                                                    <div className="text-lg font-semibold text-slate-900">
                                                        {event.name}
                                                    </div>
                                                    <div className="text-sm text-slate-600">
                                                        {formatSystemDateRange(event.date_from, event.date_to)}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {event.venue}
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-left md:text-right">
                                                    <div className="text-sm font-semibold text-[#184d47]">
                                                        {event.remaining_slots} slots left
                                                    </div>
                                                    <div className="text-sm text-slate-500">
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
                            <div className="border-b border-[#e2ebe6] px-6 py-6">
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                        Recent activity
                                    </div>
                                    <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
                                        Latest registrations
                                    </div>
                                    <p className="text-sm leading-6 text-slate-600">
                                        Recent registration activity visible within your access scope.
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 py-2">
                                {dashboard.recent_registrations.length === 0 ? (
                                    <div className="py-10 text-sm text-slate-600">
                                        No recent registrations are available for your current scope.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#e2ebe6]">
                                        {dashboard.recent_registrations.map((registration) => (
                                            <div
                                                key={registration.id}
                                                className="space-y-3 py-4"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="font-semibold text-slate-900">
                                                            {registration.event_name}
                                                        </div>
                                                        <div className="text-sm text-slate-600">
                                                            {registration.church_name}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-slate-500">
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

                                                <div className="grid gap-2 text-sm text-slate-600">
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
