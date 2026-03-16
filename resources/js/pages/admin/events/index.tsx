import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import EventController from '@/actions/App/Http/Controllers/Admin/EventController';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import DataTablePagination from '@/components/data-table-pagination';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import EntityRecordDialog from '@/components/entity-record-dialog';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    formatSystemDateOnly,
    formatSystemDateTime,
} from '@/lib/date-time';
import { successNoticeClassName } from '@/lib/ui-styles';
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

export default function EventIndex({
    events,
    filters,
    perPageOptions,
}: Props) {
    const page = usePage();
    const flash = page.props.flash as { success?: string | null } | undefined;
    const [search, setSearch] = useState(filters.search);
    const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);

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
                    <div className={successNoticeClassName}>
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
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {event.name}
                                            </div>
                                            <div className={elevatedIndexTableStyles.secondaryText}>
                                                {event.venue}
                                            </div>
                                            <div className={elevatedIndexTableStyles.detailText}>
                                                {event.description ||
                                                    'No description provided.'}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className={elevatedIndexTableStyles.strongText}>
                                                {formatSystemDateOnly(event.date_from)} to{' '}
                                                {formatSystemDateOnly(event.date_to)}
                                            </div>
                                            <div className={elevatedIndexTableStyles.secondaryText}>
                                                Opens{' '}
                                                {formatSystemDateTime(
                                                    event.registration_open_at,
                                                )}
                                            </div>
                                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                Closes{' '}
                                                {formatSystemDateTime(
                                                    event.registration_close_at,
                                                )}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <DataTableBadge
                                                    tone={resolveDataTableTone(
                                                        event.status,
                                                        {
                                                            open: 'emerald',
                                                            draft: 'slate',
                                                            closed: 'amber',
                                                            completed: 'blue',
                                                            cancelled: 'rose',
                                                        },
                                                    )}
                                                >
                                                    {event.status}
                                                </DataTableBadge>
                                                <DataTableBadge
                                                    tone={
                                                        event.accepting_registrations
                                                            ? 'emerald'
                                                            : 'slate'
                                                    }
                                                    capitalize={false}
                                                >
                                                    {event.accepting_registrations
                                                        ? 'Accepting'
                                                        : 'Not accepting'}
                                                </DataTableBadge>
                                            </div>
                                            <div className={elevatedIndexTableStyles.detailText}>
                                                {event.status_reason ||
                                                    'Registration rules are satisfied.'}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className={elevatedIndexTableStyles.strongText}>
                                                {event.remaining_slots} of{' '}
                                                {event.total_capacity} remaining
                                            </div>
                                            <div className={elevatedIndexTableStyles.secondaryText}>
                                                Reserved {event.reserved_quantity}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {event.fee_categories_count}
                                            </div>
                                            <div className={elevatedIndexTableStyles.secondaryText}>
                                                fee categories
                                            </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.lastCellRight} text-right`}
                                            >
                                            <div className={elevatedIndexTableStyles.actionGroup}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-md"
                                                    onClick={() =>
                                                        setSelectedEvent(event)
                                                    }
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-md"
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
                                                    className="rounded-md"
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

                <EntityRecordDialog
                    open={selectedEvent !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedEvent(null);
                        }
                    }}
                    title={
                        selectedEvent
                            ? `Event: ${selectedEvent.name}`
                            : 'Event'
                    }
                    description="Review the event schedule, operational status, capacity, and registration window."
                    badges={
                        selectedEvent ? (
                            <>
                                <DataTableBadge
                                    tone={resolveDataTableTone(
                                        selectedEvent.status,
                                        {
                                            open: 'emerald',
                                            draft: 'slate',
                                            closed: 'amber',
                                            completed: 'blue',
                                            cancelled: 'rose',
                                        },
                                    )}
                                >
                                    {selectedEvent.status}
                                </DataTableBadge>
                                <DataTableBadge
                                    tone={
                                        selectedEvent.accepting_registrations
                                            ? 'emerald'
                                            : 'slate'
                                    }
                                    capitalize={false}
                                >
                                    {selectedEvent.accepting_registrations
                                        ? 'Accepting registrations'
                                        : 'Not accepting'}
                                </DataTableBadge>
                            </>
                        ) : null
                    }
                    sections={
                        selectedEvent
                            ? [
                                  {
                                      title: 'Event Profile',
                                      fields: [
                                          {
                                              label: 'Event',
                                              value: selectedEvent.name,
                                          },
                                          {
                                              label: 'Venue',
                                              value: selectedEvent.venue,
                                          },
                                          {
                                              label: 'Description',
                                              value:
                                                  selectedEvent.description ??
                                                  'No description provided.',
                                              fullWidth: true,
                                          },
                                      ],
                                  },
                                  {
                                      title: 'Schedule',
                                      fields: [
                                          {
                                              label: 'Event dates',
                                              value: `${formatSystemDateOnly(selectedEvent.date_from)} to ${formatSystemDateOnly(selectedEvent.date_to)}`,
                                          },
                                          {
                                              label: 'Registration window',
                                              value: (
                                                  <>
                                                      <div>
                                                          Opens{' '}
                                                          {formatSystemDateTime(
                                                              selectedEvent.registration_open_at,
                                                          )}
                                                      </div>
                                                      <div className="text-slate-500 dark:text-slate-400">
                                                          Closes{' '}
                                                          {formatSystemDateTime(
                                                              selectedEvent.registration_close_at,
                                                          )}
                                                      </div>
                                                  </>
                                              ),
                                          },
                                      ],
                                  },
                                  {
                                      title: 'Operations',
                                      fields: [
                                          {
                                              label: 'Capacity',
                                              value: `${selectedEvent.remaining_slots} of ${selectedEvent.total_capacity} remaining`,
                                          },
                                          {
                                              label: 'Reserved',
                                              value: `${selectedEvent.reserved_quantity} reserved`,
                                          },
                                          {
                                              label: 'Fee categories',
                                              value: `${selectedEvent.fee_categories_count} configured`,
                                          },
                                          {
                                              label: 'Status reason',
                                              value:
                                                  selectedEvent.status_reason ??
                                                  'Registration rules are satisfied.',
                                              fullWidth: true,
                                          },
                                      ],
                                  },
                              ]
                            : []
                    }
                    footer={
                        selectedEvent ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedEvent(null)}
                                >
                                    Close
                                </Button>
                                <Button asChild variant="outline">
                                    <Link
                                        href={EventController.edit(
                                            selectedEvent.id,
                                        )}
                                    >
                                        Edit event
                                    </Link>
                                </Button>
                            </div>
                        ) : null
                    }
                />
            </div>
        </AppLayout>
    );
}
