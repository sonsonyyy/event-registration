import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarDays, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { onsiteCollectionIndex } from '@/actions/App/Http/Controllers/ReportsController';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import type { BreadcrumbItem } from '@/types';
import type { Auth } from '@/types/auth';

type OnsiteCollectionCollector = {
    id: number;
    name: string;
};

type OnsiteCollectionEvent = {
    id: number;
    name: string;
};

type OnsiteCollectionRecord = {
    transaction_id: number;
    transaction_date: string | null;
    collector: {
        id: number | null;
        name: string;
    };
    church_name: string;
    pastor_name: string;
    section_name: string | null;
    total_quantity: number;
    total_amount: string;
};

type OnsiteCollectionTotals = {
    transaction_count: number;
    total_quantity: number;
    total_amount: string;
};

type Props = {
    scopeSummary: string;
    onsiteCollectionFilters: {
        event_id: number | null;
        date_from: string;
        date_to: string;
        user_id: number | null;
        generated: boolean;
    };
    onsiteCollectionCollectorLocked: boolean;
    onsiteCollectionEvents: OnsiteCollectionEvent[];
    onsiteCollectionUsers: OnsiteCollectionCollector[];
    onsiteCollectionReport: {
        data: OnsiteCollectionRecord[];
        totals: OnsiteCollectionTotals;
    };
    onsiteCollectionExportUrl: string | null;
};

type CollectionReportQuery = {
    event_id?: number;
    collection_date_from?: string;
    collection_date_to?: string;
    collection_user_id?: number;
    collection_generated?: 1;
};

const onsiteCollectionTableClassName = `${elevatedIndexTableStyles.table} min-w-[90rem] table-auto`;

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

const formatTransactionDate = (value: string | null): string =>
    value ? formatSystemDateTime(value) : 'No transaction date';

const parseDateValue = (value: string): Date | undefined => {
    if (value === '') {
        return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
};

const toDateValue = (value: Date | undefined): string => {
    if (!value) {
        return '';
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

type CollectionDatePickerProps = {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    disabled?: boolean;
    onChange: (value: string) => void;
};

function CollectionDatePicker({
    id,
    label,
    value,
    placeholder,
    disabled = false,
    onChange,
}: CollectionDatePickerProps) {
    const [open, setOpen] = useState(false);
    const selectedDate = parseDateValue(value);

    return (
        <div className="grid gap-2">
            <Popover
                open={open}
                onOpenChange={(nextOpen) => {
                    if (!disabled) {
                        setOpen(nextOpen);
                    }
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        aria-label={label}
                        disabled={disabled}
                        className={cn(
                            elevatedIndexTableStyles.selectTrigger,
                            'w-full justify-between bg-white text-left font-normal shadow-none hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-950',
                            selectedDate === undefined &&
                                'text-slate-400 dark:text-slate-500',
                        )}
                    >
                        <span>
                            {selectedDate
                                ? format(selectedDate, 'MMMM d, yyyy')
                                : placeholder}
                        </span>
                        <CalendarDays className="size-4 text-slate-500 dark:text-slate-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className="w-auto rounded-md border-slate-200 p-0 dark:border-slate-800 dark:bg-slate-950"
                >
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            if (disabled) {
                                return;
                            }

                            onChange(toDateValue(date));

                            if (date !== undefined) {
                                setOpen(false);
                            }
                        }}
                    />
                </PopoverContent>
            </Popover>
            {value !== '' && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange('')}
                    disabled={disabled}
                    className="h-auto justify-start px-0 text-[12px] text-slate-500 hover:bg-transparent hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    Clear
                </Button>
            )}
        </div>
    );
}

export default function OnsiteCollectionReportIndex({
    onsiteCollectionFilters,
    onsiteCollectionCollectorLocked,
    onsiteCollectionEvents,
    onsiteCollectionUsers,
    onsiteCollectionReport,
    onsiteCollectionExportUrl,
}: Props) {
    const { auth } = usePage<{
        auth: Auth;
    }>().props;
    const [collectionDateFrom, setCollectionDateFrom] = useState(
        onsiteCollectionFilters.date_from,
    );
    const [collectionDateTo, setCollectionDateTo] = useState(
        onsiteCollectionFilters.date_to,
    );
    const [collectionUserId, setCollectionUserId] = useState(
        onsiteCollectionFilters.user_id !== null
            ? String(onsiteCollectionFilters.user_id)
            : 'all',
    );
    const [collectionEventId, setCollectionEventId] = useState(
        onsiteCollectionFilters.event_id !== null
            ? String(onsiteCollectionFilters.event_id)
            : 'none',
    );
    const hasSelectedEvent = collectionEventId !== 'none';

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Onsite Collection Report',
            href: onsiteCollectionIndex(),
        },
    ];

    const visitReport = (query: CollectionReportQuery): void => {
        router.get(
            onsiteCollectionIndex.url({
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

    const submitReport = (): void => {
        if (!hasSelectedEvent) {
            return;
        }

        visitReport({
            event_id: Number(collectionEventId),
            ...(collectionDateFrom !== ''
                ? { collection_date_from: collectionDateFrom }
                : {}),
            ...(collectionDateTo !== ''
                ? { collection_date_to: collectionDateTo }
                : {}),
            ...(collectionUserId !== 'all'
                ? { collection_user_id: Number(collectionUserId) }
                : {}),
            collection_generated: 1,
        });
    };

    const selectEvent = (value: string): void => {
        setCollectionEventId(value);
        setCollectionUserId(
            onsiteCollectionCollectorLocked ? String(auth.user.id) : 'all',
        );

        if (value === 'none') {
            visitReport({
                ...(collectionDateFrom !== ''
                    ? { collection_date_from: collectionDateFrom }
                    : {}),
                ...(collectionDateTo !== ''
                    ? { collection_date_to: collectionDateTo }
                    : {}),
                ...(onsiteCollectionCollectorLocked
                    ? { collection_user_id: auth.user.id }
                    : {}),
            });

            return;
        }

        visitReport({
            event_id: Number(value),
            ...(collectionDateFrom !== ''
                ? { collection_date_from: collectionDateFrom }
                : {}),
            ...(collectionDateTo !== ''
                ? { collection_date_to: collectionDateTo }
                : {}),
            ...(onsiteCollectionCollectorLocked
                ? { collection_user_id: auth.user.id }
                : {}),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Onsite Collection Report" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <div className="flex justify-end">
                    <div className="w-full max-w-sm sm:w-96">
                        <Select
                            value={collectionEventId}
                            onValueChange={selectEvent}
                        >
                            <SelectTrigger
                                id="collection-event-id"
                                aria-label="Event"
                                className={`${elevatedIndexTableStyles.selectTrigger} h-auto min-h-9 whitespace-normal py-2 text-left sm:min-h-10 [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal`}
                            >
                                <SelectValue placeholder="Select an event" />
                            </SelectTrigger>
                            <SelectContent
                                className={elevatedIndexTableStyles.selectContent}
                            >
                                <SelectItem
                                    value="none"
                                    className={elevatedIndexTableStyles.selectItem}
                                >
                                    Select an event
                                </SelectItem>
                                {onsiteCollectionEvents.map((event) => (
                                    <SelectItem
                                        key={event.id}
                                        value={String(event.id)}
                                        className={
                                            elevatedIndexTableStyles.selectItem
                                        }
                                    >
                                        {event.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className={elevatedIndexTableStyles.shell}>
                    <div className={elevatedIndexTableStyles.band}>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                submitReport();
                            }}
                            className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px_auto]"
                        >
                            <CollectionDatePicker
                                id="collection-date-from"
                                label="Transaction date from"
                                value={collectionDateFrom}
                                placeholder="Select a start date"
                                disabled={!hasSelectedEvent}
                                onChange={setCollectionDateFrom}
                            />

                            <CollectionDatePicker
                                id="collection-date-to"
                                label="Transaction date to"
                                value={collectionDateTo}
                                placeholder="Select an end date"
                                disabled={!hasSelectedEvent}
                                onChange={setCollectionDateTo}
                            />

                            <div className="grid gap-2">
                                <Select
                                    value={collectionUserId}
                                    onValueChange={setCollectionUserId}
                                    disabled={!hasSelectedEvent}
                                >
                                    <SelectTrigger
                                        id="collection-user-id"
                                        aria-label="Collected by"
                                        className={
                                            elevatedIndexTableStyles.selectTrigger
                                        }
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent
                                        className={
                                            elevatedIndexTableStyles.selectContent
                                        }
                                    >
                                        {!onsiteCollectionCollectorLocked && (
                                            <SelectItem
                                                value="all"
                                                className={
                                                    elevatedIndexTableStyles.selectItem
                                                }
                                            >
                                                All collectors
                                            </SelectItem>
                                        )}
                                        {onsiteCollectionUsers.map(
                                            (collector) => (
                                                <SelectItem
                                                    key={collector.id}
                                                    value={String(collector.id)}
                                                    className={
                                                        elevatedIndexTableStyles.selectItem
                                                    }
                                                >
                                                    {onsiteCollectionCollectorLocked
                                                        ? auth.user.name
                                                        : collector.name}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col justify-end gap-2 sm:flex-row xl:items-end xl:justify-end">
                                <Button
                                    type="submit"
                                    disabled={!hasSelectedEvent}
                                    className={
                                        elevatedIndexTableStyles.primaryButton
                                    }
                                >
                                    <FileText className="size-4" />
                                    Generate
                                </Button>
                                {onsiteCollectionExportUrl !== null ? (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className={
                                            elevatedIndexTableStyles.primaryButton
                                        }
                                    >
                                        <a href={onsiteCollectionExportUrl}>
                                            <Download className="size-4" />
                                            Download Excel
                                        </a>
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        disabled
                                        variant="outline"
                                        className={
                                            elevatedIndexTableStyles.primaryButton
                                        }
                                    >
                                        <Download className="size-4" />
                                        Download Excel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>

                    {onsiteCollectionFilters.generated && (
                        <div className="grid gap-3 border-b border-slate-200/80 bg-slate-50/70 px-3 py-3 sm:grid-cols-3 sm:px-4 md:px-5 dark:border-slate-800 dark:bg-slate-950/40">
                            <div className="rounded-md border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                                <div className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                    Transactions
                                </div>
                                <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                    {
                                        onsiteCollectionReport.totals
                                            .transaction_count
                                    }
                                </div>
                            </div>
                            <div className="rounded-md border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                                <div className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                    Total quantity
                                </div>
                                <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                    {
                                        onsiteCollectionReport.totals
                                            .total_quantity
                                    }
                                </div>
                            </div>
                            <div className="rounded-md border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                                <div className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                    Total amount
                                </div>
                                <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                    {formatCurrency(
                                        onsiteCollectionReport.totals
                                            .total_amount,
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className={onsiteCollectionTableClassName}>
                            <thead className={elevatedIndexTableStyles.thead}>
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
                                        Pastor
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
                                        Delegates
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                    >
                                        Total Amount
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                    >
                                        Transaction At
                                    </th>
                                    <th className="py-2 pr-4 text-right font-medium whitespace-nowrap text-slate-500 sm:py-2.5 sm:pr-5 dark:text-slate-400">
                                        Collected by
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={elevatedIndexTableStyles.tbody}>
                                {!onsiteCollectionFilters.generated ? (
                                    <tr>
                                        <td
                                            colSpan={7}
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
                                                    Generate the onsite
                                                    collection report to load
                                                    records.
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    Choose a transaction date
                                                    range, select an event, and
                                                    any needed filters, then
                                                    click Generate.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : onsiteCollectionReport.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
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
                                                    No onsite collection records
                                                    matched the selected
                                                    filters.
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    Adjust the transaction date
                                                    range or filters and
                                                    generate the report again.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    onsiteCollectionReport.data.map(
                                        (record) => (
                                            <tr
                                                key={record.transaction_id}
                                                className={
                                                    elevatedIndexTableStyles.row
                                                }
                                            >
                                                <td
                                                    className={`${elevatedIndexTableStyles.firstCell} min-w-[16rem]`}
                                                >
                                                    <div
                                                        className={`${elevatedIndexTableStyles.primaryText} whitespace-nowrap`}
                                                        title={
                                                            record.church_name
                                                        }
                                                    >
                                                        {record.church_name}
                                                    </div>
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} min-w-[14rem]`}
                                                >
                                                    <div
                                                        className={`${elevatedIndexTableStyles.primaryText} whitespace-nowrap`}
                                                        title={
                                                            record.pastor_name
                                                        }
                                                    >
                                                        {record.pastor_name}
                                                    </div>
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} min-w-[12rem] text-muted-foreground`}
                                                >
                                                    <div
                                                        className={`${elevatedIndexTableStyles.primaryText} whitespace-nowrap`}
                                                        title={
                                                            record.section_name ??
                                                            'Unassigned'
                                                        }
                                                    >
                                                        {record.section_name ??
                                                            'Unassigned'}
                                                    </div>
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} min-w-[8rem] text-right whitespace-nowrap text-foreground`}
                                                >
                                                    {record.total_quantity}
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} min-w-[10rem] text-right whitespace-nowrap text-foreground`}
                                                >
                                                    {formatCurrency(
                                                        record.total_amount,
                                                    )}
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} min-w-[14rem] text-right whitespace-nowrap text-muted-foreground`}
                                                >
                                                    {formatTransactionDate(
                                                        record.transaction_date,
                                                    )}
                                                </td>
                                                <td className="py-2.5 pr-4 text-right align-middle sm:py-3 sm:pr-5">
                                                    <div
                                                        className={`${elevatedIndexTableStyles.primaryText} whitespace-nowrap`}
                                                        title={
                                                            record.collector
                                                                .name
                                                        }
                                                    >
                                                        {record.collector.name}
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )
                                )}
                            </tbody>
                            {onsiteCollectionFilters.generated &&
                                onsiteCollectionReport.data.length > 0 && (
                                    <tfoot className="bg-slate-50/80 dark:bg-slate-900/60">
                                        <tr className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            <td
                                                colSpan={3}
                                                className="px-4 py-3 sm:px-5 sm:py-4"
                                            >
                                                Totals
                                            </td>
                                            <td className="py-3 pr-3 text-right sm:py-4 sm:pr-3.5">
                                                {
                                                    onsiteCollectionReport
                                                        .totals.total_quantity
                                                }
                                            </td>
                                            <td className="py-3 pr-4 text-right sm:py-4 sm:pr-5">
                                                {formatCurrency(
                                                    onsiteCollectionReport
                                                        .totals.total_amount,
                                                )}
                                            </td>
                                            <td
                                                colSpan={2}
                                                className="py-3 pr-4 sm:py-4 sm:pr-5"
                                            />
                                        </tr>
                                    </tfoot>
                                )}
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
