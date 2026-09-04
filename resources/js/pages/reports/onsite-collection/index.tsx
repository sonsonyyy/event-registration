import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarDays, Download } from 'lucide-react';
import { useState } from 'react';
import { onsiteCollectionIndex } from '@/actions/App/Http/Controllers/ReportsController';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
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

type OnsiteCollectionRecord = {
    transaction_id: number;
    transaction_date: string | null;
    collector: {
        id: number | null;
        name: string;
    };
    event: {
        id: number;
        name: string;
    };
    church_name: string;
    pastor_name: string;
    section_name: string | null;
    district_name: string | null;
    remarks: string | null;
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
        date_from: string;
        date_to: string;
        user_id: number | null;
        generated: boolean;
    };
    onsiteCollectionCollectorLocked: boolean;
    onsiteCollectionUsers: OnsiteCollectionCollector[];
    onsiteCollectionReport: {
        data: OnsiteCollectionRecord[];
        totals: OnsiteCollectionTotals;
    };
    onsiteCollectionExportUrl: string | null;
};

type CollectionReportQuery = {
    collection_date_from?: string;
    collection_date_to?: string;
    collection_user_id?: number;
    collection_generated?: 1;
};

const onsiteCollectionTableClassName = `${elevatedIndexTableStyles.table} min-w-[88rem]`;

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
    onChange: (value: string) => void;
};

function CollectionDatePicker({
    id,
    label,
    value,
    placeholder,
    onChange,
}: CollectionDatePickerProps) {
    const [open, setOpen] = useState(false);
    const selectedDate = parseDateValue(value);

    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
                <Label htmlFor={id}>{label}</Label>
                {value !== '' && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange('')}
                        className="h-auto px-0 text-[12px] text-slate-500 hover:bg-transparent hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        Clear
                    </Button>
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
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
                            onChange(toDateValue(date));

                            if (date !== undefined) {
                                setOpen(false);
                            }
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default function OnsiteCollectionReportIndex({
    scopeSummary,
    onsiteCollectionFilters,
    onsiteCollectionCollectorLocked,
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
        visitReport({
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Onsite Collection Report" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <Heading
                    title="Onsite Collection Report"
                    description={`Onsite collection reporting for ${scopeSummary}.`}
                    className="mb-3"
                />

                <div className={elevatedIndexTableStyles.shell}>
                    <div className={elevatedIndexTableStyles.band}>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                submitReport();
                            }}
                            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px_auto]"
                        >
                            <CollectionDatePicker
                                id="collection-date-from"
                                label="Transaction date from"
                                value={collectionDateFrom}
                                placeholder="Select a start date"
                                onChange={setCollectionDateFrom}
                            />

                            <CollectionDatePicker
                                id="collection-date-to"
                                label="Transaction date to"
                                value={collectionDateTo}
                                placeholder="Select an end date"
                                onChange={setCollectionDateTo}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="collection-user-id">
                                    Collected by
                                </Label>
                                <Select
                                    value={collectionUserId}
                                    onValueChange={setCollectionUserId}
                                >
                                    <SelectTrigger
                                        id="collection-user-id"
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
                                    className={
                                        elevatedIndexTableStyles.primaryButton
                                    }
                                >
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
                                        Transaction date
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Collected by
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Event
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
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
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Quantity
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.lastHeaderCellRight} text-right`}
                                    >
                                        Amount
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
                                                    range and any needed
                                                    filters, then click
                                                    Generate.
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
                                                    className={
                                                        elevatedIndexTableStyles.firstCell
                                                    }
                                                >
                                                    <div className="font-medium text-foreground">
                                                        {formatTransactionDate(
                                                            record.transaction_date,
                                                        )}
                                                    </div>
                                                    <div
                                                        className={
                                                            elevatedIndexTableStyles.secondaryText
                                                        }
                                                    >
                                                        Transaction #
                                                        {record.transaction_id}
                                                    </div>
                                                </td>
                                                <td
                                                    className={
                                                        elevatedIndexTableStyles.cell
                                                    }
                                                >
                                                    <div className="font-medium text-foreground">
                                                        {record.collector.name}
                                                    </div>
                                                </td>
                                                <td
                                                    className={
                                                        elevatedIndexTableStyles.cell
                                                    }
                                                >
                                                    <div className="font-medium text-foreground">
                                                        {record.event.name}
                                                    </div>
                                                    {record.remarks && (
                                                        <div
                                                            className={
                                                                elevatedIndexTableStyles.secondaryText
                                                            }
                                                        >
                                                            {record.remarks}
                                                        </div>
                                                    )}
                                                </td>
                                                <td
                                                    className={
                                                        elevatedIndexTableStyles.cell
                                                    }
                                                >
                                                    <div className="font-medium text-foreground">
                                                        {record.church_name}
                                                    </div>
                                                    <div
                                                        className={
                                                            elevatedIndexTableStyles.secondaryText
                                                        }
                                                    >
                                                        {record.pastor_name}
                                                    </div>
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} text-sm text-muted-foreground`}
                                                >
                                                    <div className="font-medium text-foreground/90">
                                                        {record.section_name ??
                                                            'Unassigned'}
                                                    </div>
                                                    <div className="mt-2">
                                                        {record.district_name ??
                                                            'No district assigned'}
                                                    </div>
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.cell} text-right font-medium text-foreground`}
                                                >
                                                    {record.total_quantity}
                                                </td>
                                                <td
                                                    className={`${elevatedIndexTableStyles.lastCellRight} text-right font-medium text-foreground`}
                                                >
                                                    {formatCurrency(
                                                        record.total_amount,
                                                    )}
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
                                                colSpan={5}
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
