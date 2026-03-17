import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import DataTablePagination from '@/components/data-table-pagination';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
import RegistrationRecordDialog from '@/components/registration-record-dialog';
import { Button } from '@/components/ui/button';
import { formatSystemDateTime } from '@/lib/date-time';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData } from '@/types';

type RegistrationItemRecord = {
    id: number;
    category_name: string;
    quantity: number;
    unit_amount: string;
    subtotal_amount: string;
};

type RegistrationRecord = {
    id: number;
    event: {
        id: number;
        name: string;
    };
    pastor: {
        id: number;
        pastor_name: string;
        church_name: string;
        section_name: string;
        district_name: string;
    };
    payment_status: string;
    payment_reference: string | null;
    registration_status: string;
    total_quantity: number;
    total_amount: string;
    remarks: string | null;
    submitted_at: string | null;
    can_edit: boolean;
    encoded_by: {
        id: number;
        name: string;
    };
    items: RegistrationItemRecord[];
};

type Props = {
    registrations: PaginatedData<RegistrationRecord>;
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
        title: 'Onsite Registration',
        href: OnsiteRegistrationController.index(),
    },
];

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

const formatDate = (value: string | null): string => {
    if (! value) {
        return 'Not submitted';
    }

    return formatSystemDateTime(value);
};

export default function OnsiteRegistrationIndex({
    registrations,
    filters,
    perPageOptions,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [selectedRegistration, setSelectedRegistration] =
        useState<RegistrationRecord | null>(null);

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    const visitIndex = (query: {
        search?: string;
        per_page: number;
        page?: number;
    }): void => {
        router.get(OnsiteRegistrationController.index.url({ query }), {}, {
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
            <Head title="Onsite Registration" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Onsite registration"
                    description="Record walk-in quantities with multiple fee-category items in a single transaction."
                    className="mb-4"
                />

                <div className={elevatedIndexTableStyles.shell}>
                    <div className={elevatedIndexTableStyles.band}>
                        <DataTableToolbar
                            searchValue={search}
                            onSearchValueChange={setSearch}
                            onSubmit={submitSearch}
                            placeholder="Search event, church, pastor, receipt, or encoder"
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
                                    <Link href={OnsiteRegistrationController.create()}>
                                        New onsite transaction
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
                                    Transaction
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Church
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Items
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Totals
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Payment
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Encoded by
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
                                {registrations.data.length === 0 ? (
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
                                                    {filters.search === ''
                                                        ? 'No onsite registrations yet.'
                                                        : `No registrations matched "${filters.search}".`}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    {filters.search === ''
                                                        ? 'Create the first onsite transaction to start recording walk-in registrations.'
                                                        : 'Try another event, church, pastor, receipt, or encoder term.'}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    registrations.data.map((registration) => (
                                        <tr
                                            key={registration.id}
                                            className={elevatedIndexTableStyles.row}
                                        >
                                            <td className={elevatedIndexTableStyles.firstCell}>
                                            <div className="font-medium text-foreground">
                                                {registration.event.name}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {formatDate(
                                                    registration.submitted_at,
                                                )}
                                            </div>
                                            <div className="mt-2">
                                                <DataTableBadge
                                                    tone={resolveDataTableTone(
                                                        registration.registration_status,
                                                        {
                                                            completed:
                                                                'emerald',
                                                            verified:
                                                                'emerald',
                                                            cancelled:
                                                                'rose',
                                                        },
                                                        'amber',
                                                    )}
                                                >
                                                    {
                                                        registration.registration_status
                                                    }
                                                </DataTableBadge>
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className="font-medium text-foreground">
                                                {
                                                    registration.pastor
                                                        .church_name
                                                }
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {
                                                    registration.pastor
                                                        .pastor_name
                                                }
                                            </div>
                                            <div className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                                                {
                                                    registration.pastor
                                                        .section_name
                                                }{' '}
                                                ·{' '}
                                                {
                                                    registration.pastor
                                                        .district_name
                                                }
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className="space-y-2">
                                                {registration.items.map(
                                                    (item) => (
                                                        <div
                                                            key={item.id}
                                                            className="rounded-md border border-sidebar-border/60 bg-background px-3 py-2"
                                                        >
                                                            <div className="font-medium text-foreground">
                                                                {
                                                                    item.category_name
                                                                }
                                                            </div>
                                                            <div className="mt-1 text-sm text-muted-foreground">
                                                                {
                                                                    item.quantity
                                                                }{' '}
                                                                x{' '}
                                                                {formatCurrency(
                                                                    item.unit_amount,
                                                                )}{' '}
                                                                ={' '}
                                                                {formatCurrency(
                                                                    item.subtotal_amount,
                                                                )}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-sm text-muted-foreground`}
                                            >
                                            <div>
                                                Quantity{' '}
                                                {registration.total_quantity}
                                            </div>
                                            <div className="mt-2 font-medium text-foreground">
                                                {formatCurrency(
                                                    registration.total_amount,
                                                )}
                                            </div>
                                            {registration.remarks && (
                                                <div className="mt-2 max-w-sm text-sm">
                                                    {registration.remarks}
                                                </div>
                                            )}
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <DataTableBadge
                                                tone={resolveDataTableTone(
                                                    registration.payment_status,
                                                    {
                                                        paid: 'emerald',
                                                        unpaid: 'rose',
                                                        partial: 'amber',
                                                    },
                                                )}
                                            >
                                                {registration.payment_status}
                                            </DataTableBadge>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                {registration.payment_reference ??
                                                    'No receipt reference'}
                                            </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-muted-foreground`}
                                            >
                                            <div>{registration.encoded_by.name}</div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.lastCellRight} text-right`}
                                            >
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setSelectedRegistration(
                                                        registration,
                                                    )
                                                }
                                            >
                                                View
                                            </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className={elevatedIndexTableStyles.paginationWrapper}>
                        <DataTablePagination
                            meta={registrations.meta}
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

                <RegistrationRecordDialog
                    open={selectedRegistration !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedRegistration(null);
                        }
                    }}
                    title={
                        selectedRegistration
                            ? `Onsite registration #${selectedRegistration.id}`
                            : 'Onsite registration'
                    }
                    description="Review the full onsite transaction, grouped quantities, payment reference, and encoder details."
                    registrationStatus={
                        selectedRegistration?.registration_status ?? 'draft'
                    }
                    paymentStatus={selectedRegistration?.payment_status ?? null}
                    totalQuantity={selectedRegistration?.total_quantity ?? 0}
                    totalAmount={selectedRegistration?.total_amount ?? '0.00'}
                    event={
                        selectedRegistration?.event ?? {
                            id: 0,
                            name: '',
                        }
                    }
                    pastor={
                        selectedRegistration?.pastor ?? {
                            id: 0,
                            church_name: '',
                            pastor_name: '',
                            section_name: '',
                            district_name: '',
                        }
                    }
                    submittedAt={selectedRegistration?.submitted_at}
                    submittedBy={
                        selectedRegistration?.encoded_by
                            ? {
                                  name: selectedRegistration.encoded_by.name,
                              }
                            : null
                    }
                    paymentReference={selectedRegistration?.payment_reference}
                    remarks={selectedRegistration?.remarks}
                    items={selectedRegistration?.items ?? []}
                    footer={
                        selectedRegistration ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setSelectedRegistration(null)
                                    }
                                >
                                    Close
                                </Button>
                                {selectedRegistration.can_edit && (
                                    <Button asChild variant="outline">
                                        <Link
                                            href={OnsiteRegistrationController.edit(
                                                selectedRegistration.id,
                                            )}
                                        >
                                            Edit transaction
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : null
                    }
                />
            </div>
        </AppLayout>
    );
}
