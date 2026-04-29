import { Head, router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useState } from 'react';
import ReportsController from '@/actions/App/Http/Controllers/ReportsController';
import DataTablePagination from '@/components/data-table-pagination';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { BreadcrumbItem, PaginatedData } from '@/types';

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

type FeeCategoryTotals = {
    registered_quantity: number;
    registered_amount: string;
};

type SectionSummaryReport = {
    id: number | null;
    name: string;
    district_name: string | null;
    active_churches: number;
    registered_churches: number;
    registration_count: number;
    total_registered_quantity: number;
    total_registered_amount: string;
};

type SectionSummaryTotals = {
    active_churches: number;
    registered_churches: number;
    registration_count: number;
    total_registered_quantity: number;
    total_registered_amount: string;
};

type ChurchSummaryReport = {
    id: number;
    church_name: string;
    pastor_name: string;
    section_name: string | null;
    district_name: string | null;
    registration_count: number;
    total_registered_quantity: number;
    total_registered_amount: string;
};

type ChurchSummaryTotals = {
    church_count: number;
    registered_churches: number;
    registration_count: number;
    total_registered_quantity: number;
    total_registered_amount: string;
};

type MissingChurchRecord = {
    id: number;
    church_name: string;
    pastor_name: string;
    section_name: string | null;
    district_name: string | null;
};

type Props = {
    scopeSummary: string;
    canFilterBySection: boolean;
    events: EventOption[];
    sections: SectionOption[];
    filters: {
        event_id: number | null;
        section_id: number | null;
        tab: ReportTab;
        search: string;
        per_page: number;
    };
    perPageOptions: number[];
    selectedEvent: SelectedEvent;
    selectedSection: SelectedSection;
    eventTotalRegistration: {
        total_registered_quantity: number;
        total_registered_amount: string;
        registration_count: number;
        verified_online_quantity: number;
        pending_online_quantity: number;
        fee_categories: FeeCategoryReport[];
        fee_category_totals: FeeCategoryTotals;
        section_summaries: SectionSummaryReport[];
        section_summary_totals: SectionSummaryTotals;
        church_summaries: ChurchSummaryReport[];
        church_summary_totals: ChurchSummaryTotals;
    };
    churchesWithRegistration: PaginatedData<ChurchSummaryReport>;
    churchesWithRegistrationExportUrl: string | null;
    churchesWithoutRegistration: PaginatedData<MissingChurchRecord>;
    churchesWithoutRegistrationExportUrl: string | null;
};

type ReportTab = 'section-summary' | 'church-summary' | 'no-registration';

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

const reportsPanelClassName =
    'overflow-hidden border border-t-4 border-[#d3ddd8] border-t-[#184d47] bg-white py-0 shadow-xl shadow-[#184d47]/8 dark:border-slate-800 dark:border-t-emerald-500 dark:bg-slate-950 dark:shadow-black/20';

const reportsPanelHeaderClassName =
    'border-b border-[#e2ebe6] px-5 py-4 dark:border-slate-800';

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

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
    perPageOptions,
    selectedEvent,
    eventTotalRegistration,
    churchesWithRegistration,
    churchesWithRegistrationExportUrl,
    churchesWithoutRegistration,
    churchesWithoutRegistrationExportUrl,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const activeReportTab = filters.tab;

    const visitReport = (query: {
        event_id?: number;
        section_id?: number;
        tab: ReportTab;
        search?: string;
        per_page: number;
        page?: number;
    }): void => {
        router.get(
            ReportsController.url({
                query,
            }),
            {},
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            },
        );
    };

    const submitSearch = (): void => {
        const normalizedSearch = search.trim();

        visitReport({
            ...(filters.event_id !== null
                ? { event_id: filters.event_id }
                : {}),
            ...(filters.section_id !== null
                ? { section_id: filters.section_id }
                : {}),
            tab: activeReportTab,
            ...(normalizedSearch !== '' ? { search: normalizedSearch } : {}),
            per_page: filters.per_page,
        });
    };

    const updatePerPage = (value: number): void => {
        visitReport({
            ...(filters.event_id !== null
                ? { event_id: filters.event_id }
                : {}),
            ...(filters.section_id !== null
                ? { section_id: filters.section_id }
                : {}),
            tab: activeReportTab,
            ...(filters.search !== '' ? { search: filters.search } : {}),
            per_page: value,
        });
    };

    const changePage = (pageNumber: number): void => {
        visitReport({
            ...(filters.event_id !== null
                ? { event_id: filters.event_id }
                : {}),
            ...(filters.section_id !== null
                ? { section_id: filters.section_id }
                : {}),
            tab: activeReportTab,
            ...(filters.search !== '' ? { search: filters.search } : {}),
            per_page: filters.per_page,
            ...(pageNumber > 1 ? { page: pageNumber } : {}),
        });
    };

    const sectionFilterValue =
        filters.section_id !== null ? String(filters.section_id) : 'all';
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Heading
                    title="Reports"
                    description={`Registration reporting for ${scopeSummary}.`}
                    className="mb-3"
                />

                <Card className={reportsPanelClassName}>
                    <CardContent className="p-5">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    {selectedEvent !== null && (
                                        <Badge
                                            variant={eventStatusVariant(
                                                selectedEvent.status,
                                            )}
                                            className="capitalize"
                                        >
                                            {selectedEvent.status}
                                        </Badge>
                                    )}
                                    <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                        Reporting scope
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[1.65rem] font-bold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
                                        {selectedEvent?.name ??
                                            'Select an event'}
                                    </div>
                                    <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                                        {selectedEvent !== null
                                            ? 'Event and section scope for this report.'
                                            : 'Choose an event to load the report.'}
                                    </p>
                                </div>
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
                                                ...(value !== ''
                                                    ? {
                                                          event_id:
                                                              Number(value),
                                                      }
                                                    : {}),
                                                ...(filters.section_id !== null
                                                    ? {
                                                          section_id:
                                                              filters.section_id,
                                                      }
                                                    : {}),
                                                tab: activeReportTab,
                                                ...(filters.search !== ''
                                                    ? { search: filters.search }
                                                    : {}),
                                                per_page: filters.per_page,
                                            })
                                        }
                                        disabled={events.length === 0}
                                    >
                                        <SelectTrigger className="h-11 w-full border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue placeholder="Select an event" />
                                        </SelectTrigger>
                                        <SelectContent
                                            align="end"
                                            className="border-slate-200 dark:border-slate-800 dark:bg-slate-950"
                                        >
                                            {events.map((event) => (
                                                <SelectItem
                                                    key={event.id}
                                                    value={String(event.id)}
                                                    className="rounded-md"
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
                                                ...(filters.event_id !== null
                                                    ? {
                                                          event_id:
                                                              filters.event_id,
                                                      }
                                                    : {}),
                                                ...(value !== 'all'
                                                    ? {
                                                          section_id:
                                                              Number(value),
                                                      }
                                                    : {}),
                                                tab: activeReportTab,
                                                ...(filters.search !== ''
                                                    ? { search: filters.search }
                                                    : {}),
                                                per_page: filters.per_page,
                                            })
                                        }
                                        disabled={!canFilterBySection}
                                    >
                                        <SelectTrigger className="h-11 w-full border-slate-200 bg-white shadow-none dark:border-slate-800 dark:bg-slate-950">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            align="end"
                                            className="border-slate-200 dark:border-slate-800 dark:bg-slate-950"
                                        >
                                            {canFilterBySection && (
                                                <SelectItem
                                                    value="all"
                                                    className="rounded-md"
                                                >
                                                    All sections
                                                </SelectItem>
                                            )}
                                            {sections.map((section) => (
                                                <SelectItem
                                                    key={section.id}
                                                    value={String(section.id)}
                                                    className="rounded-md"
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
                    <Card className="border-dashed border-[#cad4c4] bg-white/70 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                        <CardContent className="space-y-2 px-6 text-center">
                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                No events available for reporting.
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Create an event first so reporting can be
                                generated.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="overflow-hidden rounded-md border border-t-4 border-[#d6e2de] border-t-[#184d47] bg-[linear-gradient(145deg,_rgba(24,77,71,0.10),_rgba(255,255,255,0.98))] py-0 shadow-sm shadow-[#184d47]/8 dark:border-slate-800 dark:border-t-emerald-500 dark:bg-slate-950">
                                <CardContent className="p-4">
                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Total registered quantity
                                    </div>
                                    <div className="mt-3 text-[1.75rem] font-semibold text-slate-900 dark:text-slate-100">
                                        {
                                            eventTotalRegistration.total_registered_quantity
                                        }
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        All quantities in scope.
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden rounded-md border border-t-4 border-[#d9e2de] border-t-slate-900 bg-white py-0 shadow-sm shadow-[#184d47]/6 dark:border-slate-800 dark:border-t-slate-200 dark:bg-slate-950">
                                <CardContent className="p-4">
                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Verified online quantity
                                    </div>
                                    <div className="mt-3 text-[1.75rem] font-semibold text-slate-900 dark:text-slate-100">
                                        {
                                            eventTotalRegistration.verified_online_quantity
                                        }
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        Online quantities already verified.
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden rounded-md border border-t-4 border-[#ecd7d8] border-t-[#be4b56] bg-white py-0 shadow-sm shadow-[#be4b56]/8 dark:border-slate-800 dark:border-t-rose-500 dark:bg-slate-950">
                                <CardContent className="p-4">
                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Pending online quantity
                                    </div>
                                    <div className="mt-3 text-[1.75rem] font-semibold text-slate-900 dark:text-slate-100">
                                        {
                                            eventTotalRegistration.pending_online_quantity
                                        }
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        Online quantities awaiting review.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className={reportsPanelClassName}>
                            <CardContent className="p-0">
                                <div className={reportsPanelHeaderClassName}>
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                            Event Total Registration
                                        </div>
                                        <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
                                            Fee category totals
                                        </div>
                                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                                            Fee-category quantity and value
                                            totals.
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[44rem] divide-y divide-[#e2ebe6] text-[0.8125rem] sm:min-w-full sm:text-sm dark:divide-slate-800">
                                        <thead className="bg-slate-50/80 dark:bg-slate-900/60">
                                            <tr className="text-left text-xs tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                <th className="px-6 py-3 font-medium">
                                                    Fee category
                                                </th>
                                                <th className="px-6 py-3 font-medium">
                                                    Slot limit
                                                </th>
                                                <th className="px-6 py-3 text-right font-medium">
                                                    Base amount
                                                </th>
                                                <th className="px-6 py-3 text-right font-medium">
                                                    Registered quantity
                                                </th>
                                                <th className="px-6 py-3 text-right font-medium">
                                                    Registered value
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#eef3f0] dark:divide-slate-800">
                                            {eventTotalRegistration
                                                .fee_categories.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400"
                                                    >
                                                        No fee categories are
                                                        configured for this
                                                        event yet.
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
                                                                {feeCategory.slot_limit ??
                                                                    'Unlimited'}
                                                            </td>
                                                            <td className="px-6 py-4 text-right align-middle text-slate-600 dark:text-slate-400">
                                                                {formatCurrency(
                                                                    feeCategory.amount,
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right align-middle font-semibold text-slate-900 dark:text-slate-100">
                                                                {
                                                                    feeCategory.registered_quantity
                                                                }
                                                            </td>
                                                            <td className="px-6 py-4 text-right align-middle text-slate-600 dark:text-slate-400">
                                                                {formatCurrency(
                                                                    feeCategory.registered_amount,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                        {eventTotalRegistration.fee_categories
                                            .length > 0 && (
                                            <tfoot className="bg-[#f4f8f6] dark:bg-slate-900/70">
                                                <tr className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    <td
                                                        colSpan={2}
                                                        className="px-6 py-4"
                                                    >
                                                        Totals
                                                    </td>
                                                    <td className="px-6 py-4 text-right" />
                                                    <td className="px-6 py-4 text-right">
                                                        {
                                                            eventTotalRegistration
                                                                .fee_category_totals
                                                                .registered_quantity
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {formatCurrency(
                                                            eventTotalRegistration
                                                                .fee_category_totals
                                                                .registered_amount,
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3 rounded-md border border-[#d3ddd8] bg-white px-4 py-4 shadow-sm shadow-[#184d47]/6 dark:border-slate-800 dark:bg-slate-950">
                            <div className="space-y-1">
                                <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                    Detailed reports
                                </div>
                                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Registration breakdown
                                </div>
                            </div>

                            <div
                                role="tablist"
                                aria-label="Registration breakdown reports"
                                className="flex flex-wrap gap-2"
                            >
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        activeReportTab === 'section-summary'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    role="tab"
                                    aria-selected={
                                        activeReportTab === 'section-summary'
                                    }
                                    onClick={() =>
                                        visitReport({
                                            ...(filters.event_id !== null
                                                ? {
                                                      event_id:
                                                          filters.event_id,
                                                  }
                                                : {}),
                                            ...(filters.section_id !== null
                                                ? {
                                                      section_id:
                                                          filters.section_id,
                                                  }
                                                : {}),
                                            tab: 'section-summary',
                                            ...(filters.search !== ''
                                                ? { search: filters.search }
                                                : {}),
                                            per_page: filters.per_page,
                                        })
                                    }
                                    className="rounded-full px-4"
                                >
                                    By section
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        activeReportTab === 'church-summary'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    role="tab"
                                    aria-selected={
                                        activeReportTab === 'church-summary'
                                    }
                                    onClick={() =>
                                        visitReport({
                                            ...(filters.event_id !== null
                                                ? {
                                                      event_id:
                                                          filters.event_id,
                                                  }
                                                : {}),
                                            ...(filters.section_id !== null
                                                ? {
                                                      section_id:
                                                          filters.section_id,
                                                  }
                                                : {}),
                                            tab: 'church-summary',
                                            ...(filters.search !== ''
                                                ? { search: filters.search }
                                                : {}),
                                            per_page: filters.per_page,
                                        })
                                    }
                                    className="rounded-full px-4"
                                >
                                    By church
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        activeReportTab === 'no-registration'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    role="tab"
                                    aria-selected={
                                        activeReportTab === 'no-registration'
                                    }
                                    onClick={() =>
                                        visitReport({
                                            ...(filters.event_id !== null
                                                ? {
                                                      event_id:
                                                          filters.event_id,
                                                  }
                                                : {}),
                                            ...(filters.section_id !== null
                                                ? {
                                                      section_id:
                                                          filters.section_id,
                                                  }
                                                : {}),
                                            tab: 'no-registration',
                                            ...(filters.search !== ''
                                                ? { search: filters.search }
                                                : {}),
                                            per_page: filters.per_page,
                                        })
                                    }
                                    className="rounded-full px-4"
                                >
                                    No registration
                                </Button>
                            </div>
                        </div>

                        {activeReportTab === 'section-summary' && (
                            <Card className={reportsPanelClassName}>
                                <CardContent className="p-0">
                                    <div
                                        className={reportsPanelHeaderClassName}
                                    >
                                        <div className="space-y-2">
                                            <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                Registration Summary
                                            </div>
                                            <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
                                                By section
                                            </div>
                                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                                                Section totals for churches,
                                                quantity, and value.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[56rem] divide-y divide-[#e2ebe6] text-[0.8125rem] sm:min-w-full sm:text-sm dark:divide-slate-800">
                                            <thead className="bg-slate-50/80 dark:bg-slate-900/60">
                                                <tr className="text-left text-xs tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                    <th className="px-6 py-3 font-medium">
                                                        Section
                                                    </th>
                                                    <th className="px-6 py-3 text-right font-medium">
                                                        Churches with
                                                        registrations
                                                    </th>
                                                    <th className="px-6 py-3 text-right font-medium">
                                                        Registered quantity
                                                    </th>
                                                    <th className="px-6 py-3 text-right font-medium">
                                                        Registered value
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#eef3f0] dark:divide-slate-800">
                                                {eventTotalRegistration
                                                    .section_summaries
                                                    .length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={4}
                                                            className="px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400"
                                                        >
                                                            No section summary
                                                            is available for the
                                                            current event scope.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    eventTotalRegistration.section_summaries.map(
                                                        (sectionSummary) => (
                                                            <tr
                                                                key={
                                                                    sectionSummary.id ??
                                                                    sectionSummary.name
                                                                }
                                                                className="bg-white transition-colors even:bg-slate-50/50 hover:bg-[#f4f8f6] dark:bg-slate-950 dark:even:bg-slate-900/40 dark:hover:bg-slate-900"
                                                            >
                                                                <td className="px-6 py-4 align-middle">
                                                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                        {
                                                                            sectionSummary.name
                                                                        }
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right align-middle font-semibold text-slate-900 dark:text-slate-100">
                                                                    {
                                                                        sectionSummary.registered_churches
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 text-right align-middle text-slate-600 dark:text-slate-400">
                                                                    {
                                                                        sectionSummary.total_registered_quantity
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 text-right align-middle text-slate-600 dark:text-slate-400">
                                                                    {formatCurrency(
                                                                        sectionSummary.total_registered_amount,
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                )}
                                            </tbody>
                                            {eventTotalRegistration
                                                .section_summaries.length >
                                                0 && (
                                                <tfoot className="bg-[#f4f8f6] dark:bg-slate-900/70">
                                                    <tr className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        <td
                                                            colSpan={1}
                                                            className="px-6 py-4"
                                                        >
                                                            Totals
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {
                                                                eventTotalRegistration
                                                                    .section_summary_totals
                                                                    .registered_churches
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {
                                                                eventTotalRegistration
                                                                    .section_summary_totals
                                                                    .total_registered_quantity
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {formatCurrency(
                                                                eventTotalRegistration
                                                                    .section_summary_totals
                                                                    .total_registered_amount,
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeReportTab === 'church-summary' && (
                            <div className={elevatedIndexTableStyles.shell}>
                                <div className={elevatedIndexTableStyles.band}>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                Registration Summary
                                            </div>
                                            <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
                                                By church
                                            </div>
                                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                                                Search churches with
                                                registrations in scope.
                                            </p>
                                        </div>

                                        <DataTableToolbar
                                            searchValue={search}
                                            onSearchValueChange={setSearch}
                                            onSubmit={submitSearch}
                                            placeholder="Search pastor, church, or section"
                                            className={
                                                elevatedIndexTableStyles.toolbar
                                            }
                                            searchWrapperClassName={
                                                elevatedIndexTableStyles.searchWrapper
                                            }
                                            inputClassName={
                                                elevatedIndexTableStyles.input
                                            }
                                            actionClassName={
                                                elevatedIndexTableStyles.action
                                            }
                                            action={
                                                churchesWithRegistrationExportUrl !==
                                                    null &&
                                                churchesWithRegistration.meta
                                                    .total > 0 ? (
                                                    <Button
                                                        asChild
                                                        className={
                                                            elevatedIndexTableStyles.primaryButton
                                                        }
                                                    >
                                                        <a
                                                            href={
                                                                churchesWithRegistrationExportUrl
                                                            }
                                                        >
                                                            <Download className="size-4" />
                                                            Download Excel
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        disabled
                                                        className={
                                                            elevatedIndexTableStyles.primaryButton
                                                        }
                                                    >
                                                        <Download className="size-4" />
                                                        Download Excel
                                                    </Button>
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table
                                        className={
                                            elevatedIndexTableStyles.table
                                        }
                                    >
                                        <thead
                                            className={
                                                elevatedIndexTableStyles.thead
                                            }
                                        >
                                            <tr
                                                className={
                                                    elevatedIndexTableStyles.headerRow
                                                }
                                            >
                                                <th
                                                    className={
                                                        elevatedIndexTableStyles.firstHeaderCell
                                                    }
                                                >
                                                    Church name
                                                </th>
                                                <th
                                                    className={
                                                        elevatedIndexTableStyles.headerCell
                                                    }
                                                >
                                                    Pastor name
                                                </th>
                                                <th
                                                    className={
                                                        elevatedIndexTableStyles.headerCell
                                                    }
                                                >
                                                    Section
                                                </th>
                                                <th
                                                    className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                                >
                                                    Registered quantity
                                                </th>
                                                <th
                                                    className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                                >
                                                    Registered value
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody
                                            className={
                                                elevatedIndexTableStyles.tbody
                                            }
                                        >
                                            {churchesWithRegistration.data
                                                .length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className={
                                                            elevatedIndexTableStyles.emptyCell
                                                        }
                                                    >
                                                        <div className="space-y-2">
                                                            <div
                                                                className={
                                                                    elevatedIndexTableStyles.emptyTitle
                                                                }
                                                            >
                                                                {filters.search ===
                                                                ''
                                                                    ? 'No churches with registrations are available for the current event scope.'
                                                                    : `No registered churches matched "${filters.search}".`}
                                                            </div>
                                                            <div
                                                                className={
                                                                    elevatedIndexTableStyles.emptyDescription
                                                                }
                                                            >
                                                                {filters.search ===
                                                                ''
                                                                    ? 'Registrations will appear here once churches start submitting for the selected event and section scope.'
                                                                    : 'Try another pastor name, church name, or section keyword.'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                churchesWithRegistration.data.map(
                                                    (churchSummary) => (
                                                        <tr
                                                            key={
                                                                churchSummary.id
                                                            }
                                                            className={
                                                                elevatedIndexTableStyles.row
                                                            }
                                                        >
                                                            <td
                                                                className={
                                                                    elevatedIndexTableStyles.firstCell
                                                                }
                                                            >
                                                                <div className="font-medium text-foreground">
                                                                    {
                                                                        churchSummary.church_name
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td
                                                                className={
                                                                    elevatedIndexTableStyles.cell
                                                                }
                                                            >
                                                                <div className="font-medium text-foreground">
                                                                    {
                                                                        churchSummary.pastor_name
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td
                                                                className={`${elevatedIndexTableStyles.cell} text-sm text-muted-foreground`}
                                                            >
                                                                <div className="font-medium text-foreground/90">
                                                                    {churchSummary.section_name ??
                                                                        'Unassigned'}
                                                                </div>
                                                            </td>
                                                            <td
                                                                className={`${elevatedIndexTableStyles.cell} text-right font-medium text-foreground`}
                                                            >
                                                                {
                                                                    churchSummary.total_registered_quantity
                                                                }
                                                            </td>
                                                            <td
                                                                className={`${elevatedIndexTableStyles.cell} text-right font-medium text-foreground`}
                                                            >
                                                                {formatCurrency(
                                                                    churchSummary.total_registered_amount,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                        {churchesWithRegistration.data.length >
                                            0 &&
                                            filters.search === '' && (
                                                <tfoot className="bg-slate-50/90 dark:bg-slate-900/70">
                                                    <tr className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        <td
                                                            colSpan={3}
                                                            className="px-4 py-3 sm:px-6 sm:py-4"
                                                        >
                                                            Totals
                                                        </td>
                                                        <td className="py-3 pr-3 text-right sm:py-4 sm:pr-4">
                                                            {
                                                                eventTotalRegistration
                                                                    .church_summary_totals
                                                                    .total_registered_quantity
                                                            }
                                                        </td>
                                                        <td className="py-3 pr-4 text-right sm:py-4 sm:pr-6">
                                                            {formatCurrency(
                                                                eventTotalRegistration
                                                                    .church_summary_totals
                                                                    .total_registered_amount,
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                    </table>
                                </div>

                                <div
                                    className={
                                        elevatedIndexTableStyles.paginationWrapper
                                    }
                                >
                                    <DataTablePagination
                                        meta={churchesWithRegistration.meta}
                                        onPageChange={changePage}
                                        rowsPerPage={filters.per_page}
                                        rowOptions={perPageOptions}
                                        onRowsPerPageChange={updatePerPage}
                                        className={
                                            elevatedIndexTableStyles.pagination
                                        }
                                        topRowClassName={
                                            elevatedIndexTableStyles.paginationTopRow
                                        }
                                        rowsTriggerClassName={
                                            elevatedIndexTableStyles.rowsTrigger
                                        }
                                        summaryClassName={
                                            elevatedIndexTableStyles.summary
                                        }
                                        navigationWrapperClassName={
                                            elevatedIndexTableStyles.navigationWrapper
                                        }
                                        previousButtonClassName={
                                            elevatedIndexTableStyles.previousButton
                                        }
                                        nextButtonClassName={
                                            elevatedIndexTableStyles.nextButton
                                        }
                                        activePageButtonClassName={
                                            elevatedIndexTableStyles.activePageButton
                                        }
                                        inactivePageButtonClassName={
                                            elevatedIndexTableStyles.inactivePageButton
                                        }
                                        ellipsisClassName={
                                            elevatedIndexTableStyles.ellipsis
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {activeReportTab === 'no-registration' && (
                            <div className={elevatedIndexTableStyles.shell}>
                                <div className={elevatedIndexTableStyles.band}>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                No Registration Report
                                            </div>
                                            <div className="text-2xl font-bold tracking-[-0.03em] text-slate-900 dark:text-slate-100">
                                                Churches with no registration
                                            </div>
                                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                                                Search churches still missing
                                                registrations.
                                            </p>
                                        </div>

                                        <DataTableToolbar
                                            searchValue={search}
                                            onSearchValueChange={setSearch}
                                            onSubmit={submitSearch}
                                            placeholder="Search pastor, church, or section"
                                            className={
                                                elevatedIndexTableStyles.toolbar
                                            }
                                            searchWrapperClassName={
                                                elevatedIndexTableStyles.searchWrapper
                                            }
                                            inputClassName={
                                                elevatedIndexTableStyles.input
                                            }
                                            actionClassName={
                                                elevatedIndexTableStyles.action
                                            }
                                            action={
                                                churchesWithoutRegistrationExportUrl !==
                                                    null &&
                                                churchesWithoutRegistration.meta
                                                    .total > 0 ? (
                                                    <Button
                                                        asChild
                                                        className={
                                                            elevatedIndexTableStyles.primaryButton
                                                        }
                                                    >
                                                        <a
                                                            href={
                                                                churchesWithoutRegistrationExportUrl
                                                            }
                                                        >
                                                            <Download className="size-4" />
                                                            Download Excel
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        disabled
                                                        className={
                                                            elevatedIndexTableStyles.primaryButton
                                                        }
                                                    >
                                                        <Download className="size-4" />
                                                        Download Excel
                                                    </Button>
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table
                                        className={
                                            elevatedIndexTableStyles.table
                                        }
                                    >
                                        <thead
                                            className={
                                                elevatedIndexTableStyles.thead
                                            }
                                        >
                                            <tr
                                                className={
                                                    elevatedIndexTableStyles.headerRow
                                                }
                                            >
                                                <th
                                                    className={
                                                        elevatedIndexTableStyles.firstHeaderCell
                                                    }
                                                >
                                                    Pastor name
                                                </th>
                                                <th
                                                    className={
                                                        elevatedIndexTableStyles.headerCell
                                                    }
                                                >
                                                    Church name
                                                </th>
                                                <th
                                                    className={
                                                        elevatedIndexTableStyles.headerCell
                                                    }
                                                >
                                                    Section
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody
                                            className={
                                                elevatedIndexTableStyles.tbody
                                            }
                                        >
                                            {churchesWithoutRegistration.data
                                                .length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className={
                                                            elevatedIndexTableStyles.emptyCell
                                                        }
                                                    >
                                                        <div className="space-y-2">
                                                            <div
                                                                className={
                                                                    elevatedIndexTableStyles.emptyTitle
                                                                }
                                                            >
                                                                {filters.search ===
                                                                ''
                                                                    ? 'All visible churches have submitted registrations.'
                                                                    : `No churches matched "${filters.search}".`}
                                                            </div>
                                                            <div
                                                                className={
                                                                    elevatedIndexTableStyles.emptyDescription
                                                                }
                                                            >
                                                                {filters.search ===
                                                                ''
                                                                    ? 'There are no missing church registrations for the current event and section scope.'
                                                                    : 'Try another pastor name, church name, or section keyword.'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                churchesWithoutRegistration.data.map(
                                                    (church) => (
                                                        <tr
                                                            key={church.id}
                                                            className={
                                                                elevatedIndexTableStyles.row
                                                            }
                                                        >
                                                            <td
                                                                className={
                                                                    elevatedIndexTableStyles.firstCell
                                                                }
                                                            >
                                                                <div className="font-medium text-foreground">
                                                                    {
                                                                        church.pastor_name
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td
                                                                className={
                                                                    elevatedIndexTableStyles.cell
                                                                }
                                                            >
                                                                <div className="font-medium text-foreground">
                                                                    {
                                                                        church.church_name
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td
                                                                className={`${elevatedIndexTableStyles.cell} text-sm text-muted-foreground`}
                                                            >
                                                                <div className="font-medium text-foreground/90">
                                                                    {church.section_name ??
                                                                        'Unassigned'}
                                                                </div>
                                                                <div className="mt-2">
                                                                    {church.district_name ??
                                                                        'No district assigned'}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div
                                    className={
                                        elevatedIndexTableStyles.paginationWrapper
                                    }
                                >
                                    <DataTablePagination
                                        meta={churchesWithoutRegistration.meta}
                                        onPageChange={changePage}
                                        rowsPerPage={filters.per_page}
                                        rowOptions={perPageOptions}
                                        onRowsPerPageChange={updatePerPage}
                                        className={
                                            elevatedIndexTableStyles.pagination
                                        }
                                        topRowClassName={
                                            elevatedIndexTableStyles.paginationTopRow
                                        }
                                        rowsTriggerClassName={
                                            elevatedIndexTableStyles.rowsTrigger
                                        }
                                        summaryClassName={
                                            elevatedIndexTableStyles.summary
                                        }
                                        navigationWrapperClassName={
                                            elevatedIndexTableStyles.navigationWrapper
                                        }
                                        previousButtonClassName={
                                            elevatedIndexTableStyles.previousButton
                                        }
                                        nextButtonClassName={
                                            elevatedIndexTableStyles.nextButton
                                        }
                                        activePageButtonClassName={
                                            elevatedIndexTableStyles.activePageButton
                                        }
                                        inactivePageButtonClassName={
                                            elevatedIndexTableStyles.inactivePageButton
                                        }
                                        ellipsisClassName={
                                            elevatedIndexTableStyles.ellipsis
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
