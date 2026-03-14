import { Head, router } from '@inertiajs/react';
import ReportsController from '@/actions/App/Http/Controllers/ReportsController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type EventOption = {
    id: number;
    name: string;
    venue: string;
    date_from: string | null;
    date_to: string | null;
    status: string;
};

type SectionOption = {
    id: number;
    name: string;
    district_name: string | null;
};

type SelectedEvent = {
    id: number;
    name: string;
    venue: string;
    description: string | null;
    date_from: string | null;
    date_to: string | null;
    status: string;
} | null;

type SelectedSection = {
    id: number;
    name: string;
    district_name: string | null;
} | null;

type FeeCategoryReport = {
    id: number;
    category_name: string;
    amount: string;
    slot_limit: number | null;
    registered_quantity: number;
    registered_amount: string;
};

type Props = {
    scopeSummary: string;
    canFilterBySection: boolean;
    events: EventOption[];
    sections: SectionOption[];
    filters: {
        event_id: number | null;
        section_id: number | null;
    };
    selectedEvent: SelectedEvent;
    selectedSection: SelectedSection;
    eventTotalRegistration: {
        total_registered_quantity: number;
        registration_count: number;
        verified_online_quantity: number;
        pending_online_quantity: number;
        fee_categories: FeeCategoryReport[];
    };
    noRegistrationReport: {
        sections: Array<{
            id: number;
            name: string;
            district_name: string | null;
        }>;
        pastors: Array<{
            id: number;
            church_name: string;
            pastor_name: string;
            section_name: string | null;
            district_name: string | null;
        }>;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Reports',
        href: ReportsController(),
    },
];

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

const formatDateRange = (
    dateFrom: string | null,
    dateTo: string | null,
): string => {
    if (! dateFrom || ! dateTo) {
        return 'Dates not available';
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return `${formatter.format(new Date(dateFrom))} - ${formatter.format(new Date(dateTo))}`;
};

const eventStatusVariant = (
    status: string,
): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
        case 'open':
        case 'completed':
            return 'secondary';
        case 'closed':
        case 'cancelled':
            return 'destructive';
        default:
            return 'default';
    }
};

export default function ReportsIndex({
    scopeSummary,
    canFilterBySection,
    events,
    sections,
    filters,
    selectedEvent,
    selectedSection,
    eventTotalRegistration,
    noRegistrationReport,
}: Props) {
    const visitReport = (next: {
        event_id?: number;
        section_id?: number;
    }): void => {
        router.get(
            ReportsController.url({
                query: {
                    event_id: next.event_id,
                    section_id: next.section_id,
                },
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const sectionFilterValue = filters.section_id !== null
        ? String(filters.section_id)
        : 'all';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Reports"
                    description={`Operational registration reporting for ${scopeSummary}.`}
                    className="mb-4"
                />

                <Card className="overflow-hidden border border-[#d3ddd8] border-t-4 border-t-[#184d47] bg-white py-0 shadow-xl shadow-[#184d47]/8 dark:border-slate-800 dark:border-t-emerald-500 dark:bg-slate-950 dark:shadow-black/20">
                    <CardContent className="p-6">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="space-y-2">
                                <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                    Reporting scope
                                </div>
                                <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
                                    {selectedEvent?.name ?? 'Select an event'}
                                </div>
                                <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                                    Filter the event and section scope to review registration volume, fee-category totals, and missing section or church participation.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                        Event
                                    </div>
                                    <Select
                                        value={
                                            filters.event_id !== null
                                                ? String(filters.event_id)
                                                : ''
                                        }
                                        onValueChange={(value) =>
                                            visitReport({
                                                event_id:
                                                    value === ''
                                                        ? undefined
                                                        : Number(value),
                                                section_id:
                                                    filters.section_id ?? undefined,
                                            })
                                        }
                                        disabled={events.length === 0}
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue placeholder="Select an event" />
                                        </SelectTrigger>
                                        <SelectContent
                                            align="end"
                                            className="rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950"
                                        >
                                            {events.map((event) => (
                                                <SelectItem
                                                    key={event.id}
                                                    value={String(event.id)}
                                                    className="rounded-lg"
                                                >
                                                    {event.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                        Section
                                    </div>
                                    <Select
                                        value={sectionFilterValue}
                                        onValueChange={(value) =>
                                            visitReport({
                                                event_id: filters.event_id ?? undefined,
                                                section_id:
                                                    value === 'all'
                                                        ? undefined
                                                        : Number(value),
                                            })
                                        }
                                        disabled={! canFilterBySection}
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            align="end"
                                            className="rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950"
                                        >
                                            {canFilterBySection && (
                                                <SelectItem
                                                    value="all"
                                                    className="rounded-lg"
                                                >
                                                    All sections
                                                </SelectItem>
                                            )}
                                            {sections.map((section) => (
                                                <SelectItem
                                                    key={section.id}
                                                    value={String(section.id)}
                                                    className="rounded-lg"
                                                >
                                                    {section.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {selectedEvent === null ? (
                    <Card className="border-dashed border-[#cad4c4] bg-white/70 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                        <CardContent className="space-y-2 px-6 text-center">
                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                No events available for reporting.
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Create an event first so reporting can be generated.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
                            <Card className="overflow-hidden border border-[#d6e2de] border-t-4 border-t-[#184d47] bg-white py-0 shadow-xl shadow-[#184d47]/8 dark:border-slate-800 dark:border-t-emerald-500 dark:bg-slate-950 dark:shadow-black/20">
                                <CardContent className="p-6">
                                    <div className="space-y-5">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Badge
                                                variant={eventStatusVariant(
                                                    selectedEvent.status,
                                                )}
                                                className="capitalize"
                                            >
                                                {selectedEvent.status}
                                            </Badge>
                                            <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                {scopeSummary}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="text-3xl font-extrabold tracking-[-0.04em] text-slate-900 dark:text-slate-100">
                                                {selectedEvent.name}
                                            </div>
                                            <div className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                                                {selectedEvent.description ||
                                                    'No event description provided.'}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-[#e2ebe6] bg-[#f8fbfa] px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                                                <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                                    Venue
                                                </div>
                                                <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    {selectedEvent.venue}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-[#e2ebe6] bg-[#f8fbfa] px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                                                <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                                    Event dates
                                                </div>
                                                <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    {formatDateRange(
                                                        selectedEvent.date_from,
                                                        selectedEvent.date_to,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden border border-[#d3ddd8] border-t-4 border-t-slate-900 bg-white py-0 shadow-xl shadow-[#184d47]/8 dark:border-slate-800 dark:border-t-slate-200 dark:bg-slate-950 dark:shadow-black/20">
                                <CardContent className="p-6">
                                    <div className="space-y-5">
                                        <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                            Filter summary
                                        </div>

                                        <div className="divide-y divide-[#e2ebe6] dark:divide-slate-800">
                                            <div className="flex items-start justify-between gap-4 py-3 first:pt-0">
                                                <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                                    Section scope
                                                </div>
                                                <div className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {selectedSection
                                                        ? `${selectedSection.name}, ${selectedSection.district_name ?? 'District'}`
                                                        : 'All sections'}
                                                </div>
                                            </div>
                                            <div className="flex items-start justify-between gap-4 py-3">
                                                <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                                    Transactions
                                                </div>
                                                <div className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {eventTotalRegistration.registration_count}
                                                </div>
                                            </div>
                                            <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
                                                <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                                    Missing churches
                                                </div>
                                                <div className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {noRegistrationReport.pastors.length}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="overflow-hidden rounded-[24px] border border-[#d6e2de] border-t-4 border-t-[#184d47] bg-[linear-gradient(145deg,_rgba(24,77,71,0.10),_rgba(255,255,255,0.98))] py-0 shadow-sm shadow-[#184d47]/8 dark:border-slate-800 dark:border-t-emerald-500 dark:bg-slate-950">
                                <CardContent className="p-5">
                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Total registered quantity
                                    </div>
                                    <div className="mt-5 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                                        {eventTotalRegistration.total_registered_quantity}
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        All reserved or confirmed quantities for the selected event and section scope.
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden rounded-[24px] border border-[#d9e2de] border-t-4 border-t-slate-900 bg-white py-0 shadow-sm shadow-[#184d47]/6 dark:border-slate-800 dark:border-t-slate-200 dark:bg-slate-950">
                                <CardContent className="p-5">
                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Verified online quantity
                                    </div>
                                    <div className="mt-5 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                                        {eventTotalRegistration.verified_online_quantity}
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        Submitted online quantities that have already passed receipt verification.
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden rounded-[24px] border border-[#ecd7d8] border-t-4 border-t-[#be4b56] bg-white py-0 shadow-sm shadow-[#be4b56]/8 dark:border-slate-800 dark:border-t-rose-500 dark:bg-slate-950">
                                <CardContent className="p-5">
                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Pending online quantity
                                    </div>
                                    <div className="mt-5 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                                        {eventTotalRegistration.pending_online_quantity}
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        Online quantities still waiting for receipt verification review.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="overflow-hidden border border-[#d3ddd8] border-t-4 border-t-[#184d47] bg-white py-0 shadow-xl shadow-[#184d47]/8 dark:border-slate-800 dark:border-t-emerald-500 dark:bg-slate-950 dark:shadow-black/20">
                            <CardContent className="p-0">
                                <div className="border-b border-[#e2ebe6] px-6 py-6 dark:border-slate-800">
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                            Event Total Registration
                                        </div>
                                        <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
                                            Fee category totals
                                        </div>
                                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                                            Registered quantities and submitted value per fee category for the current event and section filter.
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[#e2ebe6] text-sm dark:divide-slate-800">
                                        <thead className="bg-slate-50/80 dark:bg-slate-900/60">
                                            <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                                <th className="px-6 py-3 font-medium">
                                                    Fee category
                                                </th>
                                                <th className="px-6 py-3 font-medium">
                                                    Base amount
                                                </th>
                                                <th className="px-6 py-3 font-medium">
                                                    Registered quantity
                                                </th>
                                                <th className="px-6 py-3 font-medium">
                                                    Registered value
                                                </th>
                                                <th className="px-6 py-3 font-medium">
                                                    Slot limit
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#eef3f0] dark:divide-slate-800">
                                            {eventTotalRegistration.fee_categories.length ===
                                            0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400"
                                                    >
                                                        No fee categories are configured for this event yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                eventTotalRegistration.fee_categories.map(
                                                    (feeCategory) => (
                                                        <tr
                                                            key={feeCategory.id}
                                                            className="bg-white transition-colors even:bg-slate-50/50 hover:bg-[#f4f8f6] dark:bg-slate-950 dark:even:bg-slate-900/40 dark:hover:bg-slate-900"
                                                        >
                                                            <td className="px-6 py-4 align-middle">
                                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                    {
                                                                        feeCategory.category_name
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-slate-600 dark:text-slate-400">
                                                                {formatCurrency(
                                                                    feeCategory.amount,
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle font-semibold text-slate-900 dark:text-slate-100">
                                                                {
                                                                    feeCategory.registered_quantity
                                                                }
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-slate-600 dark:text-slate-400">
                                                                {formatCurrency(
                                                                    feeCategory.registered_amount,
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 align-middle text-slate-600 dark:text-slate-400">
                                                                {feeCategory.slot_limit ??
                                                                    'Unlimited'}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <Card className="overflow-hidden border border-[#d3ddd8] border-t-4 border-t-slate-900 bg-white py-0 shadow-xl shadow-[#184d47]/8 dark:border-slate-800 dark:border-t-slate-200 dark:bg-slate-950 dark:shadow-black/20">
                                <CardContent className="p-0">
                                    <div className="border-b border-[#e2ebe6] px-6 py-6 dark:border-slate-800">
                                        <div className="space-y-2">
                                            <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                No Registration Report
                                            </div>
                                            <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
                                                Sections with no registration
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-3">
                                        {noRegistrationReport.sections.length ===
                                        0 ? (
                                            <div className="py-8 text-sm text-slate-600 dark:text-slate-400">
                                                All visible sections have submitted registrations for this event.
                                            </div>
                                        ) : (
                                            noRegistrationReport.sections.map(
                                                (section) => (
                                                    <div
                                                        key={section.id}
                                                        className="flex items-start justify-between gap-4 border-b border-[#eef3f0] py-4 last:border-b-0 dark:border-slate-800"
                                                    >
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                {section.name}
                                                            </div>
                                                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                                {section.district_name}
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline">
                                                            No registration
                                                        </Badge>
                                                    </div>
                                                ),
                                            )
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden border border-[#d3ddd8] border-t-4 border-t-[#184d47] bg-white py-0 shadow-xl shadow-[#184d47]/8 dark:border-slate-800 dark:border-t-emerald-500 dark:bg-slate-950 dark:shadow-black/20">
                                <CardContent className="p-0">
                                    <div className="border-b border-[#e2ebe6] px-6 py-6 dark:border-slate-800">
                                        <div className="space-y-2">
                                            <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                No Registration Report
                                            </div>
                                            <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
                                                Churches with no registration
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-3">
                                        {noRegistrationReport.pastors.length ===
                                        0 ? (
                                            <div className="py-8 text-sm text-slate-600 dark:text-slate-400">
                                                All visible churches have submitted registrations for this event.
                                            </div>
                                        ) : (
                                            noRegistrationReport.pastors.map(
                                                (pastor) => (
                                                    <div
                                                        key={pastor.id}
                                                        className="flex items-start justify-between gap-4 border-b border-[#eef3f0] py-4 last:border-b-0 dark:border-slate-800"
                                                    >
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                {
                                                                    pastor.church_name
                                                                }
                                                            </div>
                                                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                                {pastor.pastor_name}
                                                            </div>
                                                            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                                                {pastor.section_name}
                                                                {pastor.district_name
                                                                    ? ` • ${pastor.district_name}`
                                                                    : ''}
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline">
                                                            No registration
                                                        </Badge>
                                                    </div>
                                                ),
                                            )
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
