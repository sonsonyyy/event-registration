import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import EventController from '@/actions/App/Http/Controllers/Admin/EventController';
import DataTablePagination from '@/components/data-table-pagination';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    formatSystemDateOnly,
    formatSystemDateTime,
} from '@/lib/date-time';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData } from '@/types';

type EventRecord = {
    id: number;
    name: string;
    description: string | null;
    venue: string;
    date_from: string;
    date_to: string;
    registration_open_at: string;
    registration_close_at: string;
    status: string;
    status_reason: string | null;
    fee_categories_count: number;
    reserved_quantity: number;
    total_capacity: number;
    remaining_slots: number;
    accepting_registrations: boolean;
};

type Props = {
    events: PaginatedData<EventRecord>;
    filters: {
        search: string;
        per_page: number;
    };
    perPageOptions: number[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Events',
        href: EventController.index(),
    },
];

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

export default function EventIndex({
    events,
    filters,
    perPageOptions,
}: Props) {
    const page = usePage();
    const flash = page.props.flash as { success?: string | null } | undefined;
    const [search, setSearch] = useState(filters.search);

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    const destroy = (event: EventRecord): void => {
        if (
            ! window.confirm(
                `Delete "${event.name}"? This also removes its fee categories and registrations.`,
            )
        ) {
            return;
        }

        router.delete(EventController.destroy.url(event.id), {
            preserveScroll: true,
        });
    };

    const visitIndex = (query: {
        search?: string;
        per_page: number;
        page?: number;
    }): void => {
        router.get(EventController.index.url({ query }), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const submitSearch = (): void => {
        const normalizedSearch = search.trim();

        visitIndex({
            ...(normalizedSearch !== '' ? { search: normalizedSearch } : {}),
            per_page: filters.per_page,
        });
    };

    const updatePerPage = (value: number): void => {
        visitIndex({
            ...(filters.search !== '' ? { search: filters.search } : {}),
            per_page: value,
        });
    };

    const changePage = (pageNumber: number): void => {
        visitIndex({
            ...(filters.search !== '' ? { search: filters.search } : {}),
            per_page: filters.per_page,
            ...(pageNumber > 1 ? { page: pageNumber } : {}),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Events" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Events"
                    description="Manage event schedules, fee categories, and registration capacity in one place."
                    className="mb-4"
                />

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                        {flash.success}
                    </div>
                )}

                <div className={elevatedIndexTableStyles.shell}>
                    <div className={elevatedIndexTableStyles.band}>
                        <DataTableToolbar
                            searchValue={search}
                            onSearchValueChange={setSearch}
                            onSubmit={submitSearch}
                            placeholder="Search event name, venue, or description"
                            className={elevatedIndexTableStyles.toolbar}
                            searchWrapperClassName={
                                elevatedIndexTableStyles.searchWrapper
                            }
                            inputClassName={elevatedIndexTableStyles.input}
                            actionClassName={elevatedIndexTableStyles.action}
                            action={(
                                <Button
                                    asChild
                                    className={
                                        elevatedIndexTableStyles.primaryButton
                                    }
                                >
                                    <Link href={EventController.create()}>
                                        New event
                                    </Link>
                                </Button>
                            )}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className={elevatedIndexTableStyles.table}>
                            <thead className={elevatedIndexTableStyles.thead}>
                                <tr className={elevatedIndexTableStyles.headerRow}>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.firstHeaderCell
                                        }
                                    >
                                    Event
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Schedule
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Registration
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Capacity
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Fees
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.lastHeaderCellRight
                                        }
                                    >
                                    Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={elevatedIndexTableStyles.tbody}>
                                {events.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
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
                                                    {filters.search === ''
                                                        ? 'No events yet.'
                                                        : `No events matched "${filters.search}".`}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    {filters.search === ''
                                                        ? 'Create the first event to start accepting registrations.'
                                                        : 'Try another event name, venue, or description.'}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    events.data.map((event) => (
                                        <tr
                                            key={event.id}
                                            className={elevatedIndexTableStyles.row}
                                        >
                                            <td className={elevatedIndexTableStyles.firstCell}>
                                            <div className="font-medium text-foreground">
                                                {event.name}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {event.venue}
                                            </div>
                                            <div className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                                                {event.description ||
                                                    'No description provided.'}
                                            </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-sm text-muted-foreground`}
                                            >
                                            <div>
                                                {formatSystemDateOnly(event.date_from)} to{' '}
                                                {formatSystemDateOnly(event.date_to)}
                                            </div>
                                            <div className="mt-2 text-xs uppercase tracking-wide">
                                                Opens{' '}
                                                {formatSystemDateTime(
                                                    event.registration_open_at,
                                                )}
                                            </div>
                                            <div className="mt-1 text-xs uppercase tracking-wide">
                                                Closes{' '}
                                                    {formatSystemDateTime(
                                                        event.registration_close_at,
                                                    )}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                    variant={eventStatusVariant(
                                                        event.status,
                                                    )}
                                                    className="capitalize"
                                                >
                                                    {event.status}
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        event.accepting_registrations
                                                            ? 'secondary'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {event.accepting_registrations
                                                        ? 'Accepting'
                                                        : 'Not accepting'}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                {event.status_reason ||
                                                    'Registration rules are satisfied.'}
                                            </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-sm text-muted-foreground`}
                                            >
                                            <div>
                                                Reserved {event.reserved_quantity}
                                            </div>
                                            <div className="mt-2">
                                                Remaining {event.remaining_slots}{' '}
                                                / {event.total_capacity}
                                            </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-muted-foreground`}
                                            >
                                            {event.fee_categories_count}
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.lastCellRight} text-right`}
                                            >
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={EventController.edit(
                                                            event.id,
                                                        )}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() =>
                                                        destroy(event)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className={elevatedIndexTableStyles.paginationWrapper}>
                        <DataTablePagination
                            meta={events.meta}
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
                            summaryClassName={elevatedIndexTableStyles.summary}
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
                            ellipsisClassName={elevatedIndexTableStyles.ellipsis}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
