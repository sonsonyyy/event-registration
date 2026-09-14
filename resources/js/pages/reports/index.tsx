import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarCheck2,
    ChevronsUpDown,
    Church,
    Download,
    FileSpreadsheet,
    PhilippinePeso,
    UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import ReportsController from '@/actions/App/Http/Controllers/ReportsController';
import DataTablePagination from '@/components/data-table-pagination';
import {
    elevatedIndexTableStyles,
    reviewWorkspaceStyles,
} from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import SummaryStatCards from '@/components/summary-stat-cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatSystemDateTime } from '@/lib/date-time';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData, PaginationMeta } from '@/types';

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
    department_name: string;
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
    registered_at: string | null;
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

type ReportTab =
    | 'fee-category-totals'
    | 'section-summary'
    | 'church-summary'
    | 'no-registration';

type ReportsQuery = {
    event_id?: number;
    section_id?: number;
    tab: ReportTab;
    search?: string;
    per_page: number;
    page?: number;
};

type ReportTabDefinition = {
    value: ReportTab;
    label: string;
    icon: ComponentType<{ className?: string }>;
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

const reportTabs: ReportTabDefinition[] = [
    {
        value: 'fee-category-totals',
        label: 'By Fee Category',
        icon: PhilippinePeso,
    },
    {
        value: 'section-summary',
        label: 'By section',
        icon: CalendarCheck2,
    },
    {
        value: 'church-summary',
        label: 'By church',
        icon: UsersRound,
    },
    {
        value: 'no-registration',
        label: 'No registration',
        icon: FileSpreadsheet,
    },
];

const eventResetValue = 'select-event';

const reportTableStyles = {
    shell: 'overflow-hidden rounded-md border border-[#d6e2de] bg-white shadow-sm shadow-[#184d47]/8 dark:border-slate-800 dark:bg-slate-950',
    header: 'border-b border-[#dce4e1] bg-white px-4 py-3.5 sm:px-5 lg:px-6 dark:border-slate-800 dark:bg-slate-950',
    table: 'w-full min-w-[48rem] divide-y divide-[#e2ebe6] text-[13px] dark:divide-slate-800',
    thead: 'bg-slate-50/90 dark:bg-slate-900/60',
    headerRow:
        'text-left text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase dark:text-slate-400',
    headerCell: 'px-4 py-3 font-semibold whitespace-nowrap sm:px-5',
    body: 'divide-y divide-[#edf3f0] dark:divide-slate-800',
    row: 'bg-white transition-colors even:bg-slate-50/70 hover:bg-[#f4f8f6] dark:bg-slate-950 dark:even:bg-slate-900/50 dark:hover:bg-slate-900',
    cell: 'px-4 py-2.5 align-middle sm:px-5',
    primaryText: 'font-medium text-slate-950 dark:text-slate-100',
    footer: 'bg-[#f4f8f6] text-sm font-semibold text-slate-950 dark:bg-slate-900/70 dark:text-slate-100',
    emptyCell:
        'px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400',
} as const;

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

const formatRegisteredAt = (value: string | null): string =>
    value ? formatSystemDateTime(value) : '—';

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
    const eventFilterValue =
        filters.event_id !== null ? String(filters.event_id) : eventResetValue;
    const sectionFilterValue =
        filters.section_id !== null ? String(filters.section_id) : 'all';
    const missingChurchesCount = churchesWithoutRegistration.meta.total;
    const registeredChurchesCount =
        eventTotalRegistration.church_summary_totals.registered_churches ||
        eventTotalRegistration.section_summary_totals.registered_churches;
    const summaryCards = [
        {
            title: 'Total Delegates',
            value: eventTotalRegistration.total_registered_quantity,
            icon: UsersRound,
            cardClassName: reviewWorkspaceStyles.summaryCardApproved,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconApproved,
        },
        {
            title: 'Total Value',
            value: formatCurrency(
                eventTotalRegistration.total_registered_amount,
            ),
            icon: PhilippinePeso,
            cardClassName: reviewWorkspaceStyles.summaryCardApproved,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconApproved,
        },
        {
            title: 'Churches Registered',
            value: registeredChurchesCount,
            icon: Church,
            cardClassName: reviewWorkspaceStyles.summaryCardPending,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconPending,
        },
        {
            title: 'No Registration',
            value: missingChurchesCount,
            icon: AlertTriangle,
            cardClassName: reviewWorkspaceStyles.summaryCardRejected,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconRejected,
        },
    ] as const;

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    const currentReportQuery = (
        searchValue = filters.search,
    ): Omit<ReportsQuery, 'page'> => ({
        ...(filters.event_id !== null ? { event_id: filters.event_id } : {}),
        ...(filters.section_id !== null
            ? { section_id: filters.section_id }
            : {}),
        tab: activeReportTab,
        ...(searchValue !== '' ? { search: searchValue } : {}),
        per_page: filters.per_page,
    });

    const visitReport = (query: ReportsQuery): void => {
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

    const reportQueryForTab = (tab: ReportTab): ReportsQuery => ({
        ...(filters.event_id !== null ? { event_id: filters.event_id } : {}),
        ...(filters.section_id !== null
            ? { section_id: filters.section_id }
            : {}),
        tab,
        per_page: filters.per_page,
    });

    const submitSearch = (): void => {
        const normalizedSearch = search.trim();

        visitReport(currentReportQuery(normalizedSearch));
    };

    const updatePerPage = (value: number): void => {
        visitReport({
            ...currentReportQuery(),
            per_page: value,
        });
    };

    const changePage = (pageNumber: number): void => {
        visitReport({
            ...currentReportQuery(),
            ...(pageNumber > 1 ? { page: pageNumber } : {}),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex flex-1 flex-col gap-5 bg-white p-4 md:p-6 dark:bg-slate-950">
                <section className="border-b border-[#dce4e1] px-1 pt-1 pb-5 dark:border-slate-800">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,48rem)] lg:items-start">
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                {selectedEvent !== null && (
                                    <Badge
                                        variant={eventStatusVariant(
                                            selectedEvent.status,
                                        )}
                                        className={cn(
                                            'capitalize',
                                            ['open', 'completed'].includes(
                                                selectedEvent.status,
                                            ) &&
                                                'border-transparent bg-[#b8ead7] text-[#0f513f] hover:bg-[#b8ead7] dark:bg-emerald-500/20 dark:text-emerald-200',
                                        )}
                                    >
                                        {selectedEvent.status}
                                    </Badge>
                                )}
                                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {selectedEvent?.department_name ??
                                        'Select an event'}
                                </div>
                            </div>

                            <div>
                                <h1 className="max-w-3xl text-xl leading-tight font-bold text-slate-950 sm:text-[1.35rem] dark:text-slate-100">
                                    {selectedEvent?.name ?? 'Select an event'}
                                </h1>
                            </div>
                        </div>

                        <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,24rem)_minmax(9rem,12rem)] sm:justify-end">
                            <div className="min-w-0 space-y-2">
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Event
                                </div>
                                <Select
                                    value={eventFilterValue}
                                    onValueChange={(value) => {
                                        if (value === eventResetValue) {
                                            visitReport({
                                                tab: 'section-summary',
                                                per_page: filters.per_page,
                                            });

                                            return;
                                        }

                                        visitReport({
                                            event_id: Number(value),
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
                                        });
                                    }}
                                    disabled={events.length === 0}
                                >
                                    <SelectTrigger className="h-11 w-full max-w-full min-w-0 border-[#d6e2de] bg-white shadow-none focus-visible:border-[#184d47]/40 focus-visible:ring-[#184d47]/15 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-800 dark:bg-slate-950">
                                        <SelectValue placeholder="Select an event" />
                                    </SelectTrigger>
                                    <SelectContent
                                        align="end"
                                        className="border-[#d6e2de] dark:border-slate-800 dark:bg-slate-950"
                                    >
                                        <SelectItem
                                            value={eventResetValue}
                                            className="rounded-md"
                                        >
                                            Select an event
                                        </SelectItem>
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

                            <div className="min-w-0 space-y-2">
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                                                      section_id: Number(value),
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
                                    <SelectTrigger className="h-11 w-full max-w-full min-w-0 border-[#d6e2de] bg-white shadow-none focus-visible:border-[#184d47]/40 focus-visible:ring-[#184d47]/15 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-800 dark:bg-slate-950">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent
                                        align="end"
                                        className="border-[#d6e2de] dark:border-slate-800 dark:bg-slate-950"
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
                </section>

                {selectedEvent === null ? (
                    <section className="rounded-md border border-dashed border-[#cad4c4] bg-white/80 px-6 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Select an event to load reports.
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Choose an event from the selector above to view
                            report totals and detailed tables.
                        </p>
                    </section>
                ) : (
                    <div className="space-y-5">
                        <SummaryStatCards
                            gridClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                            items={summaryCards}
                        />
                        <section className="min-w-0 space-y-4">
                            <div className="border-b border-[#dce4e1] dark:border-slate-800">
                                <div
                                    role="tablist"
                                    aria-label="Registration breakdown reports"
                                    className="flex flex-wrap gap-7"
                                >
                                    {reportTabs.map((tab) => (
                                        <ReportTabButton
                                            key={tab.value}
                                            tab={tab}
                                            selected={
                                                activeReportTab === tab.value
                                            }
                                            onClick={() =>
                                                visitReport(
                                                    reportQueryForTab(
                                                        tab.value,
                                                    ),
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            {activeReportTab === 'fee-category-totals' && (
                                <FeeCategoryTotalsReportTable
                                    feeCategories={
                                        eventTotalRegistration.fee_categories
                                    }
                                    totals={
                                        eventTotalRegistration.fee_category_totals
                                    }
                                />
                            )}

                            {activeReportTab === 'section-summary' && (
                                <SectionSummaryReportTable
                                    summaries={
                                        eventTotalRegistration.section_summaries
                                    }
                                    totals={
                                        eventTotalRegistration.section_summary_totals
                                    }
                                />
                            )}

                            {activeReportTab === 'church-summary' && (
                                <ChurchSummaryReportTable
                                    search={search}
                                    setSearch={setSearch}
                                    submitSearch={submitSearch}
                                    records={churchesWithRegistration}
                                    totals={
                                        eventTotalRegistration.church_summary_totals
                                    }
                                    exportUrl={
                                        churchesWithRegistrationExportUrl
                                    }
                                    filters={filters}
                                    perPageOptions={perPageOptions}
                                    updatePerPage={updatePerPage}
                                    changePage={changePage}
                                />
                            )}

                            {activeReportTab === 'no-registration' && (
                                <MissingRegistrationReportTable
                                    search={search}
                                    setSearch={setSearch}
                                    submitSearch={submitSearch}
                                    records={churchesWithoutRegistration}
                                    exportUrl={
                                        churchesWithoutRegistrationExportUrl
                                    }
                                    filters={filters}
                                    perPageOptions={perPageOptions}
                                    updatePerPage={updatePerPage}
                                    changePage={changePage}
                                />
                            )}
                        </section>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function FeeCategoryTotalsReportTable({
    feeCategories,
    totals,
}: {
    feeCategories: FeeCategoryReport[];
    totals: FeeCategoryTotals;
}) {
    return (
        <div className={reportTableStyles.shell}>
            <div className="overflow-x-auto">
                <table className={cn(reportTableStyles.table, 'min-w-full')}>
                    <thead className={reportTableStyles.thead}>
                        <tr className={reportTableStyles.headerRow}>
                            <th className={reportTableStyles.headerCell}>
                                Fee category
                            </th>
                            <th
                                className={`${reportTableStyles.headerCell} text-right`}
                            >
                                Slot limit
                            </th>
                            <th
                                className={`${reportTableStyles.headerCell} text-right`}
                            >
                                Base
                            </th>
                            <th
                                className={`${reportTableStyles.headerCell} text-right`}
                            >
                                Registered
                            </th>
                            <th
                                className={`${reportTableStyles.headerCell} text-right`}
                            >
                                Value
                            </th>
                        </tr>
                    </thead>
                    <tbody className={reportTableStyles.body}>
                        {feeCategories.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className={reportTableStyles.emptyCell}
                                >
                                    No fee categories configured.
                                </td>
                            </tr>
                        ) : (
                            feeCategories.map((feeCategory) => (
                                <tr
                                    key={feeCategory.id}
                                    className={reportTableStyles.row}
                                >
                                    <td className={reportTableStyles.cell}>
                                        <div
                                            className={
                                                reportTableStyles.primaryText
                                            }
                                        >
                                            {feeCategory.category_name}
                                        </div>
                                    </td>
                                    <td
                                        className={`${reportTableStyles.cell} text-right text-slate-600 dark:text-slate-400`}
                                    >
                                        {feeCategory.slot_limit ?? '—'}
                                    </td>
                                    <td
                                        className={`${reportTableStyles.cell} text-right text-slate-600 dark:text-slate-400`}
                                    >
                                        {formatCurrency(feeCategory.amount)}
                                    </td>
                                    <td
                                        className={`${reportTableStyles.cell} text-right font-semibold text-slate-950 dark:text-slate-100`}
                                    >
                                        {feeCategory.registered_quantity}
                                    </td>
                                    <td
                                        className={`${reportTableStyles.cell} text-right font-medium text-slate-950 dark:text-slate-100`}
                                    >
                                        {formatCurrency(
                                            feeCategory.registered_amount,
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {feeCategories.length > 0 && (
                        <tfoot className={reportTableStyles.footer}>
                            <tr>
                                <td
                                    colSpan={3}
                                    className={reportTableStyles.cell}
                                >
                                    Totals
                                </td>
                                <td
                                    className={`${reportTableStyles.cell} text-right`}
                                >
                                    {totals.registered_quantity}
                                </td>
                                <td
                                    className={`${reportTableStyles.cell} text-right`}
                                >
                                    {formatCurrency(totals.registered_amount)}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

function ReportTabButton({
    tab,
    selected,
    onClick,
}: {
    tab: ReportTabDefinition;
    selected: boolean;
    onClick: () => void;
}) {
    const Icon = tab.icon;

    return (
        <Button
            type="button"
            variant="ghost"
            role="tab"
            aria-selected={selected}
            onClick={onClick}
            className={cn(
                'relative h-11 rounded-none px-0 text-sm font-medium text-slate-600 hover:bg-transparent hover:text-slate-950 dark:text-slate-300 dark:hover:bg-transparent dark:hover:text-slate-100',
                selected &&
                    'bg-transparent text-[#184d47] after:absolute after:right-0 after:-bottom-px after:left-0 after:h-0.5 after:rounded-full after:bg-[#184d47] dark:bg-transparent dark:text-emerald-300 dark:after:bg-emerald-400',
            )}
        >
            <Icon className="size-4" />
            {tab.label}
        </Button>
    );
}

function SectionSummaryReportTable({
    summaries,
    totals,
}: {
    summaries: SectionSummaryReport[];
    totals: SectionSummaryTotals;
}) {
    return (
        <div className={reportTableStyles.shell}>
            <div className="overflow-x-auto">
                <table className={cn(reportTableStyles.table, 'min-w-full')}>
                    <thead className={reportTableStyles.thead}>
                        <tr className={reportTableStyles.headerRow}>
                            <th className={reportTableStyles.headerCell}>
                                Section
                            </th>
                            <th
                                className={`${reportTableStyles.headerCell} text-right`}
                            >
                                Churches
                            </th>
                            <th
                                className={`${reportTableStyles.headerCell} text-right`}
                            >
                                Quantity
                            </th>
                            <th
                                className={`${reportTableStyles.headerCell} text-right`}
                            >
                                Value
                            </th>
                        </tr>
                    </thead>
                    <tbody className={reportTableStyles.body}>
                        {summaries.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className={reportTableStyles.emptyCell}
                                >
                                    No section summary is available for the
                                    current event scope.
                                </td>
                            </tr>
                        ) : (
                            summaries.map((summary) => (
                                <tr
                                    key={summary.id ?? summary.name}
                                    className={reportTableStyles.row}
                                >
                                    <td className={reportTableStyles.cell}>
                                        <div
                                            className={
                                                reportTableStyles.primaryText
                                            }
                                        >
                                            {summary.name}
                                        </div>
                                    </td>
                                    <td
                                        className={`${reportTableStyles.cell} text-right font-semibold text-slate-950 dark:text-slate-100`}
                                    >
                                        {summary.registered_churches}
                                    </td>
                                    <td
                                        className={`${reportTableStyles.cell} text-right text-slate-600 dark:text-slate-400`}
                                    >
                                        {summary.total_registered_quantity}
                                    </td>
                                    <td
                                        className={`${reportTableStyles.cell} text-right text-slate-600 dark:text-slate-400`}
                                    >
                                        {formatCurrency(
                                            summary.total_registered_amount,
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {summaries.length > 0 && (
                        <tfoot className={reportTableStyles.footer}>
                            <tr>
                                <td className={reportTableStyles.cell}>
                                    Totals
                                </td>
                                <td
                                    className={`${reportTableStyles.cell} text-right`}
                                >
                                    {totals.registered_churches}
                                </td>
                                <td
                                    className={`${reportTableStyles.cell} text-right`}
                                >
                                    {totals.total_registered_quantity}
                                </td>
                                <td
                                    className={`${reportTableStyles.cell} text-right`}
                                >
                                    {formatCurrency(
                                        totals.total_registered_amount,
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}

function ChurchSummaryReportTable({
    search,
    setSearch,
    submitSearch,
    records,
    totals,
    exportUrl,
    filters,
    perPageOptions,
    updatePerPage,
    changePage,
}: {
    search: string;
    setSearch: (value: string) => void;
    submitSearch: () => void;
    records: PaginatedData<ChurchSummaryReport>;
    totals: ChurchSummaryTotals;
    exportUrl: string | null;
    filters: Props['filters'];
    perPageOptions: number[];
    updatePerPage: (value: number) => void;
    changePage: (pageNumber: number) => void;
}) {
    const showTotalsRow =
        records.data.length > 0 &&
        records.meta.current_page === records.meta.last_page;

    return (
        <div className={reportTableStyles.shell}>
            <ReportSearchHeader
                search={search}
                setSearch={setSearch}
                submitSearch={submitSearch}
                placeholder="Search pastor or church"
                exportUrl={exportUrl}
                exportEnabled={records.meta.total > 0}
            />

            <div className="overflow-x-auto">
                <table className={cn(reportTableStyles.table, 'min-w-[64rem]')}>
                    <thead className={reportTableStyles.thead}>
                        <tr className={reportTableStyles.headerRow}>
                            <th className={reportTableStyles.headerCell}>
                                Church
                            </th>
                            <th className={reportTableStyles.headerCell}>
                                Pastor
                            </th>
                            <th className={reportTableStyles.headerCell}>
                                Section
                            </th>
                            <th
                                className={`${reportTableStyles.headerCell} text-right`}
                            >
                                Quantity
                            </th>
                            <th
                                className={`${reportTableStyles.headerCell} text-right`}
                            >
                                Value
                            </th>
                            <th
                                className={`${reportTableStyles.headerCell} text-right`}
                            >
                                Registered At
                            </th>
                        </tr>
                    </thead>
                    <tbody className={reportTableStyles.body}>
                        {records.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className={reportTableStyles.emptyCell}
                                >
                                    {filters.search === ''
                                        ? 'No churches with registrations are available for the current event scope.'
                                        : `No registered churches matched "${filters.search}".`}
                                </td>
                            </tr>
                        ) : (
                            records.data.map((record) => (
                                <tr
                                    key={record.id}
                                    className={reportTableStyles.row}
                                >
                                    <td className={reportTableStyles.cell}>
                                        <div
                                            className={
                                                reportTableStyles.primaryText
                                            }
                                        >
                                            {record.church_name}
                                        </div>
                                    </td>
                                    <td className={reportTableStyles.cell}>
                                        <div className="text-slate-700 dark:text-slate-300">
                                            {record.pastor_name}
                                        </div>
                                    </td>
                                    <td className={reportTableStyles.cell}>
                                        <SectionCell
                                            sectionName={record.section_name}
                                        />
                                    </td>
                                    <td
                                        className={`${reportTableStyles.cell} text-right font-semibold text-slate-950 dark:text-slate-100`}
                                    >
                                        {record.total_registered_quantity}
                                    </td>
                                    <td
                                        className={`${reportTableStyles.cell} text-right font-medium text-slate-950 dark:text-slate-100`}
                                    >
                                        {formatCurrency(
                                            record.total_registered_amount,
                                        )}
                                    </td>
                                    <td
                                        className={`${reportTableStyles.cell} text-right`}
                                    >
                                        <div className="text-slate-600 dark:text-slate-400">
                                            {formatRegisteredAt(
                                                record.registered_at,
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {showTotalsRow && (
                        <tfoot className={reportTableStyles.footer}>
                            <tr>
                                <td
                                    colSpan={3}
                                    className={reportTableStyles.cell}
                                >
                                    Totals
                                </td>
                                <td
                                    className={`${reportTableStyles.cell} text-right`}
                                >
                                    {totals.total_registered_quantity}
                                </td>
                                <td
                                    className={`${reportTableStyles.cell} text-right`}
                                >
                                    {formatCurrency(
                                        totals.total_registered_amount,
                                    )}
                                </td>
                                <td className={reportTableStyles.cell} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            <ReportPagination
                meta={records.meta}
                filters={filters}
                perPageOptions={perPageOptions}
                updatePerPage={updatePerPage}
                changePage={changePage}
            />
        </div>
    );
}

function MissingRegistrationReportTable({
    search,
    setSearch,
    submitSearch,
    records,
    exportUrl,
    filters,
    perPageOptions,
    updatePerPage,
    changePage,
}: {
    search: string;
    setSearch: (value: string) => void;
    submitSearch: () => void;
    records: PaginatedData<MissingChurchRecord>;
    exportUrl: string | null;
    filters: Props['filters'];
    perPageOptions: number[];
    updatePerPage: (value: number) => void;
    changePage: (pageNumber: number) => void;
}) {
    return (
        <div className={reportTableStyles.shell}>
            <ReportSearchHeader
                search={search}
                setSearch={setSearch}
                submitSearch={submitSearch}
                placeholder="Search pastor or church"
                exportUrl={exportUrl}
                exportEnabled={records.meta.total > 0}
            />

            <div className="hidden md:block">
                <div className="overflow-x-auto">
                    <table className={reportTableStyles.table}>
                        <thead className={reportTableStyles.thead}>
                            <tr className={reportTableStyles.headerRow}>
                                <th className={reportTableStyles.headerCell}>
                                    <SortableHeaderLabel>
                                        Church
                                    </SortableHeaderLabel>
                                </th>
                                <th className={reportTableStyles.headerCell}>
                                    <SortableHeaderLabel>
                                        Pastor
                                    </SortableHeaderLabel>
                                </th>
                                <th className={reportTableStyles.headerCell}>
                                    <SortableHeaderLabel>
                                        Section
                                    </SortableHeaderLabel>
                                </th>
                            </tr>
                        </thead>
                        <tbody className={reportTableStyles.body}>
                            {records.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className={reportTableStyles.emptyCell}
                                    >
                                        {filters.search === ''
                                            ? 'Every church in the current event scope has a registration.'
                                            : `No missing-registration churches matched "${filters.search}".`}
                                    </td>
                                </tr>
                            ) : (
                                records.data.map((record) => (
                                    <tr
                                        key={record.id}
                                        className={reportTableStyles.row}
                                    >
                                        <td className={reportTableStyles.cell}>
                                            <div
                                                className={
                                                    reportTableStyles.primaryText
                                                }
                                            >
                                                {record.church_name}
                                            </div>
                                        </td>
                                        <td className={reportTableStyles.cell}>
                                            <div className="text-slate-700 dark:text-slate-300">
                                                {record.pastor_name}
                                            </div>
                                        </td>
                                        <td className={reportTableStyles.cell}>
                                            <div className="font-medium text-slate-950 dark:text-slate-100">
                                                {record.section_name ??
                                                    'Unassigned'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="divide-y divide-[#edf3f0] md:hidden dark:divide-slate-800">
                {records.data.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        {filters.search === ''
                            ? 'Every church in the current event scope has a registration.'
                            : `No missing-registration churches matched "${filters.search}".`}
                    </div>
                ) : (
                    records.data.map((record) => (
                        <div
                            key={record.id}
                            className="space-y-3 bg-white px-4 py-4 even:bg-slate-50/70 dark:bg-slate-950 dark:even:bg-slate-900/50"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="font-medium text-slate-950 dark:text-slate-100">
                                        {record.church_name}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                        {record.pastor_name}
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-950 dark:bg-orange-950/20 dark:text-orange-300"
                                >
                                    Missing
                                </Badge>
                            </div>
                            <div className="text-sm">
                                <div>
                                    <div className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase dark:text-slate-400">
                                        Section
                                    </div>
                                    <div className="mt-1 text-slate-800 dark:text-slate-200">
                                        {record.section_name ?? 'Unassigned'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ReportPagination
                meta={records.meta}
                filters={filters}
                perPageOptions={perPageOptions}
                updatePerPage={updatePerPage}
                changePage={changePage}
            />
        </div>
    );
}

function SortableHeaderLabel({ children }: { children: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            {children}
            <ChevronsUpDown className="size-3 text-slate-400 dark:text-slate-500" />
        </span>
    );
}

function ReportSearchHeader({
    search,
    setSearch,
    submitSearch,
    placeholder,
    exportUrl,
    exportEnabled,
}: {
    search: string;
    setSearch: (value: string) => void;
    submitSearch: () => void;
    placeholder: string;
    exportUrl: string | null;
    exportEnabled: boolean;
}) {
    return (
        <div className={reportTableStyles.header}>
            <DataTableToolbar
                searchValue={search}
                onSearchValueChange={setSearch}
                onSubmit={submitSearch}
                placeholder={placeholder}
                className="gap-3 sm:flex-row sm:items-center sm:justify-between"
                searchWrapperClassName="w-full sm:max-w-md"
                inputClassName="h-11 rounded-md border-[#d6e2de] bg-white pl-10 text-sm shadow-none placeholder:text-slate-400 focus-visible:border-[#184d47]/40 focus-visible:ring-[#184d47]/15 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-500"
                actionClassName="w-full sm:w-auto"
                action={
                    exportUrl !== null && exportEnabled ? (
                        <Button
                            asChild
                            className="h-11 rounded-md bg-[#184d47] px-5 whitespace-nowrap text-white shadow-xs hover:bg-[#143f3a]"
                        >
                            <a href={exportUrl}>
                                <Download className="size-4" />
                                Download Excel
                            </a>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            disabled
                            className="h-11 rounded-md bg-[#184d47] px-5 whitespace-nowrap text-white shadow-xs disabled:bg-[#184d47]/35 disabled:text-white"
                        >
                            <Download className="size-4" />
                            Download Excel
                        </Button>
                    )
                }
            />
        </div>
    );
}

function ReportPagination({
    meta,
    filters,
    perPageOptions,
    updatePerPage,
    changePage,
}: {
    meta: PaginationMeta;
    filters: Props['filters'];
    perPageOptions: number[];
    updatePerPage: (value: number) => void;
    changePage: (pageNumber: number) => void;
}) {
    return (
        <div className="border-t border-[#dce4e1] bg-slate-50/80 px-4 py-3 sm:px-5 dark:border-slate-800 dark:bg-slate-950/70">
            <DataTablePagination
                meta={meta}
                rowsPerPage={filters.per_page}
                rowOptions={perPageOptions}
                onRowsPerPageChange={updatePerPage}
                onPageChange={changePage}
                className={elevatedIndexTableStyles.pagination}
                topRowClassName={elevatedIndexTableStyles.paginationTopRow}
                rowsTriggerClassName={elevatedIndexTableStyles.rowsTrigger}
                summaryClassName={elevatedIndexTableStyles.summary}
                navigationWrapperClassName={
                    elevatedIndexTableStyles.navigationWrapper
                }
                previousButtonClassName={
                    elevatedIndexTableStyles.previousButton
                }
                nextButtonClassName={elevatedIndexTableStyles.nextButton}
                activePageButtonClassName={
                    elevatedIndexTableStyles.activePageButton
                }
                inactivePageButtonClassName={
                    elevatedIndexTableStyles.inactivePageButton
                }
                ellipsisClassName={elevatedIndexTableStyles.ellipsis}
            />
        </div>
    );
}

function SectionCell({ sectionName }: { sectionName: string | null }) {
    return (
        <div>
            <div className="font-medium text-slate-950 dark:text-slate-100">
                {sectionName ?? 'Unassigned'}
            </div>
        </div>
    );
}
