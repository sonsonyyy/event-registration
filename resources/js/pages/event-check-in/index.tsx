import { Head, router, useForm } from '@inertiajs/react';
import {
    Boxes,
    Clock3,
    PackageCheck,
    PackageMinus,
    PackagePlus,
} from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import EventCheckInController from '@/actions/App/Http/Controllers/EventCheckInController';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import DataTablePagination from '@/components/data-table-pagination';
import {
    elevatedIndexTableStyles,
    reviewWorkspaceStyles,
} from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import SummaryStatCards from '@/components/summary-stat-cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatSystemDateOnly, formatSystemDateTime } from '@/lib/date-time';
import { formTextareaClassName } from '@/lib/ui-styles';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData } from '@/types';

type EventOption = {
    id: number;
    name: string;
    venue: string;
    date_from: string | null;
    date_to: string | null;
    status: string;
    scope_type: string;
    district_name: string | null;
    section_name: string | null;
    department_name: string | null;
};

type SectionOption = {
    id: number;
    name: string;
    district_name: string | null;
};

type ClaimStatusOption = {
    value: string;
    label: string;
};

type FeeCategorySummary = {
    id: number;
    category_name: string;
    registered_quantity: number;
    claimed_quantity: number;
    remaining_quantity: number;
};

type ClaimHistoryItem = {
    id: number;
    category_name: string;
    quantity_claimed: number;
    remarks: string | null;
};

type ClaimHistoryRecord = {
    id: number;
    representative_name: string;
    total_claimed_quantity: number;
    remarks: string | null;
    checked_in_at: string | null;
    checked_in_by: {
        id: number;
        name: string;
    } | null;
    items: ClaimHistoryItem[];
};

type ChurchRecord = {
    id: number;
    church_name: string;
    pastor_name: string;
    section_name: string | null;
    district_name: string | null;
    registered_quantity: number;
    claimed_quantity: number;
    remaining_quantity: number;
    claim_status: string;
    last_claim_at: string | null;
    category_totals: FeeCategorySummary[];
    claim_history: ClaimHistoryRecord[];
};

type SelectedEvent = {
    id: number;
    name: string;
    venue: string;
    description: string | null;
    date_from: string | null;
    date_to: string | null;
    status: string;
    scope_type: string;
    district_name: string | null;
    section_name: string | null;
    department_name: string | null;
} | null;

type Props = {
    scopeSummary: string;
    canFilterBySection: boolean;
    events: EventOption[];
    sections: SectionOption[];
    claimStatusOptions: ClaimStatusOption[];
    filters: {
        event_id: number | null;
        section_id: number | null;
        search: string;
        claim_status: string;
        per_page: number;
    };
    perPageOptions: number[];
    selectedEvent: SelectedEvent;
    summary: {
        registered_quantity: number;
        claimed_quantity: number;
        remaining_quantity: number;
        churches_not_claimed: number;
    };
    feeCategorySummary: FeeCategorySummary[];
    churches: PaginatedData<ChurchRecord>;
};

type CheckInIndexQuery = {
    event_id?: number;
    section_id?: number;
    search?: string;
    claim_status: string;
    per_page: number;
    page?: number;
};

type ClaimFormLineItem = {
    fee_category_id: number;
    quantity_claimed: string;
    remarks: string;
};

type ClaimFormData = {
    event_id: number | null;
    pastor_id: number | null;
    representative_name: string;
    remarks: string;
    line_items: ClaimFormLineItem[];
    current_filters: {
        section_id: number | null;
        search: string;
        claim_status: string;
        per_page: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Event Check-in',
        href: EventCheckInController.index(),
    },
];

const checkInTableClassName = `${elevatedIndexTableStyles.table} min-w-[88rem]`;

const formatDateTime = (value: string | null, fallback = 'Not yet claimed') =>
    value ? formatSystemDateTime(value) : fallback;

const formatEventDateRange = (
    dateFrom: string | null,
    dateTo: string | null,
): string => {
    if (dateFrom !== null && dateTo !== null) {
        if (dateFrom === dateTo) {
            return formatSystemDateOnly(dateFrom);
        }

        return `${formatSystemDateOnly(dateFrom)} - ${formatSystemDateOnly(dateTo)}`;
    }

    if (dateFrom !== null) {
        return formatSystemDateOnly(dateFrom);
    }

    if (dateTo !== null) {
        return formatSystemDateOnly(dateTo);
    }

    return 'Date TBA';
};

const claimStatusTone = (value: string) =>
    resolveDataTableTone(
        value,
        {
            'not claimed': 'amber',
            'partially claimed': 'blue',
            'fully claimed': 'emerald',
        },
        'slate',
    );

const eventStatusTone = (value: string) =>
    resolveDataTableTone(
        value,
        {
            open: 'emerald',
            completed: 'emerald',
            closed: 'rose',
            cancelled: 'rose',
            draft: 'slate',
        },
        'slate',
    );

const emptyClaimFormData = (filters: Props['filters']): ClaimFormData => ({
    event_id: filters.event_id,
    pastor_id: null,
    representative_name: '',
    remarks: '',
    line_items: [],
    current_filters: {
        section_id: filters.section_id,
        search: filters.search,
        claim_status: filters.claim_status,
        per_page: filters.per_page,
    },
});

export default function EventCheckInIndex({
    canFilterBySection,
    events,
    sections,
    claimStatusOptions,
    filters,
    perPageOptions,
    selectedEvent,
    summary,
    feeCategorySummary,
    churches,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [sectionId, setSectionId] = useState(
        filters.section_id !== null ? String(filters.section_id) : 'all',
    );
    const [claimStatus, setClaimStatus] = useState(filters.claim_status);
    const [selectedChurch, setSelectedChurch] = useState<ChurchRecord | null>(
        null,
    );
    const form = useForm<ClaimFormData>(emptyClaimFormData(filters));

    const setClaimFormForChurch = (church: ChurchRecord): void => {
        form.clearErrors();
        form.setData({
            event_id: filters.event_id,
            pastor_id: church.id,
            representative_name: '',
            remarks: '',
            line_items: church.category_totals.map((category) => ({
                fee_category_id: category.id,
                quantity_claimed: '',
                remarks: '',
            })),
            current_filters: {
                section_id: filters.section_id,
                search: filters.search,
                claim_status: filters.claim_status,
                per_page: filters.per_page,
            },
        });
    };

    const buildQuery = ({
        eventValue,
        sectionValue,
        searchValue,
        claimStatusValue,
        perPage,
        page,
    }: {
        eventValue: string;
        sectionValue: string;
        searchValue: string;
        claimStatusValue: string;
        perPage: number;
        page?: number;
    }): CheckInIndexQuery => {
        const normalizedSearch = searchValue.trim();

        return {
            ...(eventValue !== 'none' ? { event_id: Number(eventValue) } : {}),
            ...(sectionValue !== 'all'
                ? { section_id: Number(sectionValue) }
                : {}),
            ...(normalizedSearch !== '' ? { search: normalizedSearch } : {}),
            claim_status: claimStatusValue,
            per_page: perPage,
            ...(page !== undefined && page > 1 ? { page } : {}),
        };
    };

    const visitIndex = (query: CheckInIndexQuery): void => {
        router.get(
            EventCheckInController.index.url({ query }),
            {},
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            },
        );
    };

    const selectChurch = (church: ChurchRecord): void => {
        setSelectedChurch(church);
        setClaimFormForChurch(church);
    };

    const closeDrawer = (): void => {
        setSelectedChurch(null);
        form.clearErrors();
        form.setData(emptyClaimFormData(filters));
    };

    const syncSelectedChurchFromProps = useEffectEvent((): void => {
        if (selectedChurch === null) {
            return;
        }

        const refreshedChurch =
            churches.data.find((church) => church.id === selectedChurch.id) ??
            null;

        if (refreshedChurch === null) {
            closeDrawer();

            return;
        }

        const claimStateChanged =
            refreshedChurch.claimed_quantity !== selectedChurch.claimed_quantity ||
            refreshedChurch.remaining_quantity !==
                selectedChurch.remaining_quantity ||
            refreshedChurch.claim_status !== selectedChurch.claim_status ||
            refreshedChurch.last_claim_at !== selectedChurch.last_claim_at ||
            refreshedChurch.claim_history.length !==
                selectedChurch.claim_history.length;

        if (! claimStateChanged) {
            return;
        }

        setSelectedChurch(refreshedChurch);
        setClaimFormForChurch(refreshedChurch);
    });

    useEffect(() => {
        syncSelectedChurchFromProps();
    }, [churches.data, filters, selectedChurch]);

    const submitSearch = (): void => {
        visitIndex(
            buildQuery({
                eventValue:
                    filters.event_id !== null ? String(filters.event_id) : 'none',
                sectionValue: sectionId,
                searchValue: search,
                claimStatusValue: claimStatus,
                perPage: filters.per_page,
            }),
        );
    };

    const updatePerPage = (value: number): void => {
        visitIndex(
            buildQuery({
                eventValue:
                    filters.event_id !== null ? String(filters.event_id) : 'none',
                sectionValue:
                    filters.section_id !== null
                        ? String(filters.section_id)
                        : 'all',
                searchValue: filters.search,
                claimStatusValue: filters.claim_status,
                perPage: value,
            }),
        );
    };

    const changePage = (pageNumber: number): void => {
        visitIndex(
            buildQuery({
                eventValue:
                    filters.event_id !== null ? String(filters.event_id) : 'none',
                sectionValue:
                    filters.section_id !== null
                        ? String(filters.section_id)
                        : 'all',
                searchValue: filters.search,
                claimStatusValue: filters.claim_status,
                perPage: filters.per_page,
                page: pageNumber,
            }),
        );
    };

    const updateLineItem = (
        lineIndex: number,
        field: keyof ClaimFormLineItem,
        value: string,
    ): void => {
        form.setData(
            'line_items',
            form.data.line_items.map((lineItem, index) =>
                index === lineIndex
                    ? {
                          ...lineItem,
                          [field]: value,
                      }
                    : lineItem,
            ),
        );
        form.clearErrors(`line_items.${lineIndex}.${field}`);
    };

    const submitClaim = (): void => {
        form.transform((data) => ({
            ...data,
            line_items: data.line_items.map((lineItem) => ({
                ...lineItem,
                quantity_claimed:
                    lineItem.quantity_claimed.trim() === ''
                        ? 0
                        : Number(lineItem.quantity_claimed),
            })),
        }));

        form.submit(EventCheckInController.store(), {
            preserveScroll: true,
        });
    };

    const summaryCards = [
        {
            title: 'Registered Qty',
            value: summary.registered_quantity,
            subtitle: 'Approved quantity',
            icon: Boxes,
            cardClassName: reviewWorkspaceStyles.summaryCard,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconWrapper,
        },
        {
            title: 'Claimed Qty',
            value: summary.claimed_quantity,
            subtitle: 'Already released',
            icon: PackageCheck,
            cardClassName: reviewWorkspaceStyles.summaryCardApproved,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconApproved,
        },
        {
            title: 'Remaining Qty',
            value: summary.remaining_quantity,
            subtitle: 'Still available to claim',
            icon: PackageMinus,
            cardClassName: reviewWorkspaceStyles.summaryCardPending,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconPending,
        },
        {
            title: 'Not Yet Claimed',
            value: summary.churches_not_claimed,
            subtitle: 'Churches still waiting',
            icon: Clock3,
            cardClassName: reviewWorkspaceStyles.summaryCardPending,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconPending,
        },
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Event Check-in" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-5">
                <Heading
                    title="Event Check-in"
                    description="Claim kits and track attendance by church."
                />

                <Card className="border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(247,250,249,0.98),_rgba(255,255,255,1))] shadow-sm shadow-[#184d47]/8 dark:border-slate-800 dark:bg-slate-950">
                    <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="border-[#cfe0da] bg-white/85 text-[#184d47] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                >
                                    <PackageCheck className="mr-1.5 size-3.5" />
                                    Kit Claiming & Attendance
                                </Badge>
                                {selectedEvent && (
                                    <DataTableBadge
                                        tone={eventStatusTone(
                                            selectedEvent.status,
                                        )}
                                    >
                                        {selectedEvent.status}
                                    </DataTableBadge>
                                )}
                            </div>

                            <div className="space-y-1">
                                <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                                    {selectedEvent?.name ??
                                        'Select an accessible event'}
                                </CardTitle>
                                <CardDescription className="max-w-3xl text-[13px] leading-5">
                                    {selectedEvent
                                        ? `${selectedEvent.venue} - ${formatEventDateRange(selectedEvent.date_from, selectedEvent.date_to)}`
                                        : 'Only events with claimable registrations inside your scope appear here.'}
                                </CardDescription>
                            </div>
                        </div>

                        <div className="w-full max-w-sm shrink-0 space-y-2">
                            <Label htmlFor="event_id">Event</Label>
                            <Select
                                value={
                                    filters.event_id !== null
                                        ? String(filters.event_id)
                                        : 'none'
                                }
                                onValueChange={(value) =>
                                    visitIndex(
                                        buildQuery({
                                            eventValue: value,
                                            sectionValue: 'all',
                                            searchValue: '',
                                            claimStatusValue: 'all',
                                            perPage: filters.per_page,
                                        }),
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="event_id"
                                    className={elevatedIndexTableStyles.selectTrigger}
                                >
                                    <SelectValue placeholder="Select an event" />
                                </SelectTrigger>
                                <SelectContent
                                    className={elevatedIndexTableStyles.selectContent}
                                >
                                    {events.length === 0 ? (
                                        <SelectItem
                                            value="none"
                                            disabled
                                            className={elevatedIndexTableStyles.selectItem}
                                        >
                                            No accessible events
                                        </SelectItem>
                                    ) : (
                                        events.map((event) => (
                                            <SelectItem
                                                key={event.id}
                                                value={String(event.id)}
                                                className={elevatedIndexTableStyles.selectItem}
                                            >
                                                {event.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                </Card>

                <SummaryStatCards
                    gridClassName="grid gap-3 xl:grid-cols-4"
                    items={summaryCards}
                />

                <div className="space-y-5">
                    <Card className="border-[#d6e2de] dark:border-slate-800">
                        <CardHeader>
                            <CardTitle>Fee-category progress</CardTitle>
                            <CardDescription>
                                Monitor registered, claimed, and remaining
                                quantities for the selected event.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {feeCategorySummary.length === 0 ? (
                                <div className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-sm text-muted-foreground dark:border-slate-700">
                                    Select an event with claimable
                                    registrations to view fee-category
                                    progress.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {feeCategorySummary.map((category) => (
                                        <div
                                            key={category.id}
                                            className="grid gap-2 rounded-md border border-slate-200/80 bg-slate-50/70 px-3 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/40 lg:grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(0,11rem))]"
                                        >
                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                {category.category_name}
                                            </div>
                                            <div className="text-slate-600 dark:text-slate-300">
                                                Registered:{' '}
                                                {category.registered_quantity}
                                            </div>
                                            <div className="text-slate-600 dark:text-slate-300">
                                                Claimed:{' '}
                                                {category.claimed_quantity}
                                            </div>
                                            <div className="text-slate-600 dark:text-slate-300">
                                                Remaining:{' '}
                                                {category.remaining_quantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className={elevatedIndexTableStyles.shell}>
                        <div className={elevatedIndexTableStyles.band}>
                            <DataTableToolbar
                                searchValue={search}
                                onSearchValueChange={setSearch}
                                onSubmit={submitSearch}
                                placeholder="Search church, pastor, section, or district"
                                className={elevatedIndexTableStyles.toolbar}
                                searchWrapperClassName={
                                    elevatedIndexTableStyles.searchWrapper
                                }
                                inputClassName={elevatedIndexTableStyles.input}
                                actionClassName={elevatedIndexTableStyles.action}
                                action={
                                    <div
                                        className={
                                            elevatedIndexTableStyles.headerActions
                                        }
                                    >
                                        {canFilterBySection &&
                                            sections.length > 0 && (
                                                <Select
                                                    value={sectionId}
                                                    onValueChange={(value) => {
                                                        setSectionId(value);
                                                        visitIndex(
                                                            buildQuery({
                                                                eventValue:
                                                                    filters.event_id !==
                                                                    null
                                                                        ? String(
                                                                              filters.event_id,
                                                                          )
                                                                        : 'none',
                                                                sectionValue:
                                                                    value,
                                                                searchValue:
                                                                    search,
                                                                claimStatusValue:
                                                                    claimStatus,
                                                                perPage:
                                                                    filters.per_page,
                                                            }),
                                                        );
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            elevatedIndexTableStyles.selectTrigger
                                                        }
                                                    >
                                                        <SelectValue placeholder="All sections" />
                                                    </SelectTrigger>
                                                    <SelectContent
                                                        className={
                                                            elevatedIndexTableStyles.selectContent
                                                        }
                                                    >
                                                        <SelectItem
                                                            value="all"
                                                            className={
                                                                elevatedIndexTableStyles.selectItem
                                                            }
                                                        >
                                                            All sections
                                                        </SelectItem>
                                                        {sections.map(
                                                            (section) => (
                                                                <SelectItem
                                                                    key={
                                                                        section.id
                                                                    }
                                                                    value={String(
                                                                        section.id,
                                                                    )}
                                                                    className={
                                                                        elevatedIndexTableStyles.selectItem
                                                                    }
                                                                >
                                                                    {
                                                                        section.name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}

                                        <Select
                                            value={claimStatus}
                                            onValueChange={(value) => {
                                                setClaimStatus(value);
                                                visitIndex(
                                                    buildQuery({
                                                        eventValue:
                                                            filters.event_id !==
                                                            null
                                                                ? String(
                                                                      filters.event_id,
                                                                  )
                                                                : 'none',
                                                        sectionValue:
                                                            sectionId,
                                                        searchValue: search,
                                                        claimStatusValue:
                                                            value,
                                                        perPage:
                                                            filters.per_page,
                                                    }),
                                                );
                                            }}
                                        >
                                            <SelectTrigger
                                                className={
                                                    elevatedIndexTableStyles.selectTrigger
                                                }
                                            >
                                                <SelectValue placeholder="Claim status" />
                                            </SelectTrigger>
                                            <SelectContent
                                                className={
                                                    elevatedIndexTableStyles.selectContent
                                                }
                                            >
                                                {claimStatusOptions.map(
                                                    (option) => (
                                                        <SelectItem
                                                            key={option.value}
                                                            value={
                                                                option.value
                                                            }
                                                            className={
                                                                elevatedIndexTableStyles.selectItem
                                                            }
                                                        >
                                                            {option.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                }
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className={checkInTableClassName}>
                                <thead
                                    className={elevatedIndexTableStyles.thead}
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
                                            Church
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
                                            Registered Qty
                                        </th>
                                        <th
                                            className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                        >
                                            Claimed Qty
                                        </th>
                                        <th
                                            className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                        >
                                            Remaining Qty
                                        </th>
                                        <th
                                            className={`${elevatedIndexTableStyles.headerCell} text-center`}
                                        >
                                            Claim Status
                                        </th>
                                        <th
                                            className={`${elevatedIndexTableStyles.headerCell} text-center`}
                                        >
                                            Last Claim
                                        </th>
                                        <th
                                            className={
                                                elevatedIndexTableStyles.lastHeaderCellRight
                                            }
                                        >
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody
                                    className={elevatedIndexTableStyles.tbody}
                                >
                                    {churches.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
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
                                                        {filters.event_id ===
                                                        null
                                                            ? 'Select an event to begin booth operations.'
                                                            : filters.search ===
                                                                  '' &&
                                                              filters.claim_status ===
                                                                  'all'
                                                            ? 'No claimable churches matched the current scope.'
                                                            : 'No churches matched the current filters.'}
                                                    </div>
                                                    <div
                                                        className={
                                                            elevatedIndexTableStyles.emptyDescription
                                                        }
                                                    >
                                                        Refine the event,
                                                        section, or claim
                                                        status filters to
                                                        continue.
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        churches.data.map((church) => (
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
                                                    <div
                                                        className={
                                                            elevatedIndexTableStyles.primaryText
                                                        }
                                                    >
                                                        {church.church_name}
                                                    </div>
                                                    <div
                                                        className={
                                                            elevatedIndexTableStyles.secondaryText
                                                        }
                                                    >
                                                        {church.pastor_name}
                                                    </div>
                                                </td>
                                                <td
                                                    className={
                                                        elevatedIndexTableStyles.cell
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            elevatedIndexTableStyles.primaryText
                                                        }
                                                    >
                                                        {church.section_name ??
                                                            'Unassigned'}
                                                    </div>
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} text-right font-medium text-slate-900 dark:text-slate-100`}
                                                >
                                                    {
                                                        church.registered_quantity
                                                    }
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} text-right font-medium text-slate-900 dark:text-slate-100`}
                                                >
                                                    {church.claimed_quantity}
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} text-right font-medium text-slate-900 dark:text-slate-100`}
                                                >
                                                    {
                                                        church.remaining_quantity
                                                    }
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} text-center`}
                                                >
                                                    <DataTableBadge
                                                        tone={claimStatusTone(
                                                            church.claim_status,
                                                        )}
                                                    >
                                                        {church.claim_status}
                                                    </DataTableBadge>
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} min-w-[12rem] text-center text-muted-foreground`}
                                                >
                                                    {formatDateTime(
                                                        church.last_claim_at,
                                                    )}
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.lastCellRight} min-w-[8rem] text-right`}
                                                >
                                                    {church.claim_status !==
                                                    'fully claimed' ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className={
                                                                reviewWorkspaceStyles.surfaceButton
                                                            }
                                                            onClick={() =>
                                                                selectChurch(
                                                                    church,
                                                                )
                                                            }
                                                        >
                                                            <PackagePlus className="size-4" />
                                                            Claim
                                                        </Button>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))
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
                                meta={churches.meta}
                                onPageChange={changePage}
                                rowsPerPage={filters.per_page}
                                rowOptions={perPageOptions}
                                onRowsPerPageChange={updatePerPage}
                                className={elevatedIndexTableStyles.pagination}
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
                </div>

                <Drawer
                    open={selectedChurch !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDrawer();
                        }
                    }}
                >
                    {selectedChurch && (
                        <DrawerContent
                            side="right"
                            className="w-full border-l border-[#d6e2de] p-0 sm:max-w-xl xl:max-w-2xl dark:border-slate-800"
                        >
                            <DrawerHeader className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#fcfdfb_0%,#f7f9f7_100%)] pr-12 dark:border-slate-800 dark:bg-slate-950/80">
                                <div className="flex flex-wrap items-center gap-2">
                                    <DrawerTitle>
                                        {selectedChurch.church_name}
                                    </DrawerTitle>
                                    <DataTableBadge
                                        tone={claimStatusTone(
                                            selectedChurch.claim_status,
                                        )}
                                    >
                                        {selectedChurch.claim_status}
                                    </DataTableBadge>
                                </div>
                                <DrawerDescription>
                                    {selectedChurch.pastor_name} •{' '}
                                    {selectedChurch.section_name ??
                                        'Unassigned section'}
                                </DrawerDescription>
                            </DrawerHeader>

                            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-md border border-slate-200/80 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                            Registered
                                        </div>
                                        <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                            {selectedChurch.registered_quantity}
                                        </div>
                                    </div>
                                    <div className="rounded-md border border-slate-200/80 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                            Claimed
                                        </div>
                                        <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                            {selectedChurch.claimed_quantity}
                                        </div>
                                    </div>
                                    <div className="rounded-md border border-slate-200/80 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                            Remaining
                                        </div>
                                        <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                            {selectedChurch.remaining_quantity}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Heading
                                        title="Claim breakdown"
                                        description="Enter the quantity being released for each fee category."
                                        variant="small"
                                    />

                                    <div className="space-y-3">
                                        {selectedChurch.category_totals.map(
                                            (category, index) => (
                                                <div
                                                    key={category.id}
                                                    className="rounded-md border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40"
                                                >
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                                        {
                                                            category.category_name
                                                        }
                                                    </div>
                                                    <div className="mt-2 grid gap-2 text-[12px] text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                                                        <div>
                                                            Registered:{' '}
                                                            {
                                                                category.registered_quantity
                                                            }
                                                        </div>
                                                        <div>
                                                            Claimed:{' '}
                                                            {
                                                                category.claimed_quantity
                                                            }
                                                        </div>
                                                        <div>
                                                            Remaining:{' '}
                                                            {
                                                                category.remaining_quantity
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 grid gap-3">
                                                        <div className="space-y-2">
                                                            <Label
                                                                htmlFor={`line_items.${index}.quantity_claimed`}
                                                            >
                                                                Quantity to
                                                                claim
                                                            </Label>
                                                            <Input
                                                                id={`line_items.${index}.quantity_claimed`}
                                                                name={`line_items.${index}.quantity_claimed`}
                                                                type="number"
                                                                min={0}
                                                                max={
                                                                    category.remaining_quantity
                                                                }
                                                                value={
                                                                    form.data
                                                                        .line_items[
                                                                        index
                                                                    ]
                                                                        ?.quantity_claimed ??
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateLineItem(
                                                                        index,
                                                                        'quantity_claimed',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    category.remaining_quantity ===
                                                                    0
                                                                }
                                                            />
                                                            <InputError
                                                                message={
                                                                    form.errors[
                                                                        `line_items.${index}.quantity_claimed`
                                                                    ]
                                                                }
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label
                                                                htmlFor={`line_items.${index}.remarks`}
                                                            >
                                                                Remarks for
                                                                this category
                                                            </Label>
                                                            <Input
                                                                id={`line_items.${index}.remarks`}
                                                                name={`line_items.${index}.remarks`}
                                                                value={
                                                                    form.data
                                                                        .line_items[
                                                                        index
                                                                    ]?.remarks ??
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateLineItem(
                                                                        index,
                                                                        'remarks',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Optional line-item note"
                                                            />
                                                            <InputError
                                                                message={
                                                                    form.errors[
                                                                        `line_items.${index}.remarks`
                                                                    ]
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-md border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/40">
                                    <div className="space-y-2">
                                        <Label htmlFor="representative_name">
                                            Representative name
                                        </Label>
                                        <Input
                                            id="representative_name"
                                            name="representative_name"
                                            value={
                                                form.data.representative_name
                                            }
                                            onChange={(event) => {
                                                form.setData(
                                                    'representative_name',
                                                    event.target.value,
                                                );
                                                form.clearErrors(
                                                    'representative_name',
                                                );
                                            }}
                                            placeholder="Who is claiming the kits?"
                                        />
                                        <InputError
                                            message={
                                                form.errors.representative_name
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="remarks">
                                            Overall remarks
                                        </Label>
                                        <textarea
                                            id="remarks"
                                            name="remarks"
                                            value={form.data.remarks}
                                            onChange={(event) => {
                                                form.setData(
                                                    'remarks',
                                                    event.target.value,
                                                );
                                                form.clearErrors('remarks');
                                            }}
                                            placeholder="Optional booth notes"
                                            className={`${formTextareaClassName} min-h-24`}
                                        />
                                        <InputError
                                            message={form.errors.remarks}
                                        />
                                    </div>

                                    <InputError
                                        message={form.errors.line_items}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Heading
                                        title="Claim history"
                                        description="Every prior Event Check-in for this church and event is preserved below."
                                        variant="small"
                                    />

                                    {selectedChurch.claim_history.length ===
                                    0 ? (
                                        <div className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-sm text-muted-foreground dark:border-slate-700">
                                            No claims have been recorded yet for
                                            this church.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedChurch.claim_history.map(
                                                (claim) => (
                                                    <div
                                                        key={claim.id}
                                                        className="rounded-md border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40"
                                                    >
                                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                {
                                                                    claim.representative_name
                                                                }
                                                            </div>
                                                            <div className="text-[12px] text-slate-500 dark:text-slate-400">
                                                                {formatDateTime(
                                                                    claim.checked_in_at,
                                                                    'Date unavailable',
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 text-[12px] text-slate-600 dark:text-slate-300">
                                                            Claimed:{' '}
                                                            {
                                                                claim.total_claimed_quantity
                                                            }{' '}
                                                            - Processed by{' '}
                                                            {claim.checked_in_by
                                                                ?.name ??
                                                                'Unknown user'}
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {claim.items.map(
                                                                (item) => (
                                                                    <Badge
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        variant="outline"
                                                                        className="border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                                                    >
                                                                        {
                                                                            item.category_name
                                                                        }
                                                                        :{' '}
                                                                        {
                                                                            item.quantity_claimed
                                                                        }
                                                                    </Badge>
                                                                ),
                                                            )}
                                                        </div>
                                                        {claim.remarks && (
                                                            <div className="mt-2 text-[12px] text-slate-600 dark:text-slate-300">
                                                                {claim.remarks}
                                                            </div>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DrawerFooter className="border-t border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={closeDrawer}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        type="button"
                                        className={
                                            reviewWorkspaceStyles.primaryButton
                                        }
                                        onClick={submitClaim}
                                        disabled={
                                            form.processing ||
                                            selectedChurch.remaining_quantity ===
                                                0
                                        }
                                    >
                                        Confirm claim
                                    </Button>
                                </div>
                            </DrawerFooter>
                        </DrawerContent>
                    )}
                </Drawer>
            </div>
        </AppLayout>
    );
}
