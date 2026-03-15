import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import AssignedChurchCard from '@/components/assigned-church-card';
import DataTablePagination from '@/components/data-table-pagination';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        venue: string;
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
    receipt: {
        original_name: string | null;
        uploaded_at: string | null;
    };
    items: RegistrationItemRecord[];
};

type AssignedPastor = {
    id: number;
    pastor_name: string;
    church_name: string;
    section_name: string;
    district_name: string;
    status: string;
} | null;

type Props = {
    assignedPastor: AssignedPastor;
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
        title: 'Online Registration',
        href: OnlineRegistrationController.index(),
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

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
};

const registrationStatusClassName = (status: string): string => {
    switch (status) {
        case 'verified':
        case 'completed':
            return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300';
        case 'rejected':
        case 'cancelled':
            return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300';
        default:
            return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-300';
    }
};

export default function OnlineRegistrationIndex({
    assignedPastor,
    registrations,
    filters,
    perPageOptions,
}: Props) {
    const page = usePage();
    const flash = page.props.flash as
        | { success?: string | null }
        | undefined;
    const [search, setSearch] = useState(filters.search);

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    const visitIndex = (query: {
        search?: string;
        per_page: number;
        page?: number;
    }): void => {
        router.get(OnlineRegistrationController.index.url({ query }), {}, {
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
            <Head title="Online Registration" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Online registration"
                    description="View your submitted church registrations and monitor their verification status."
                    className="mb-4"
                />

                {assignedPastor && (
                    <AssignedChurchCard assignedPastor={assignedPastor} />
                )}

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
                            placeholder="Search event, venue, reference, or uploaded receipt"
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
                                    <Link href={OnlineRegistrationController.create()}>
                                        New online registration
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
                                        Event
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Items
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Total
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Receipt
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={elevatedIndexTableStyles.tbody}>
                                {registrations.data.length === 0 ? (
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
                                                        ? 'No online registrations yet.'
                                                        : `No registrations matched "${filters.search}".`}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    {filters.search === ''
                                                        ? 'Create your first online registration to submit quantities for your church.'
                                                        : 'Try another event, venue, reference, or receipt term.'}
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
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    #{registration.id}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {formatDate(
                                                        registration.submitted_at,
                                                    )}
                                                </div>
                                                {registration.payment_reference && (
                                                    <div className="mt-2 inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-200">
                                                        Ref. {registration.payment_reference}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {registration.event.name}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {registration.event.venue}
                                                </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div className="space-y-2">
                                                    {registration.items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="text-sm text-slate-500 dark:text-slate-400"
                                                        >
                                                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                                                {item.category_name}
                                                            </span>{' '}
                                                            × {item.quantity}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {formatCurrency(
                                                        registration.total_amount,
                                                    )}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {registration.total_quantity}{' '}
                                                    delegates
                                                </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {registration.receipt.original_name ??
                                                        'No receipt uploaded'}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {formatDate(
                                                        registration.receipt.uploaded_at,
                                                    )}
                                                </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div className="flex flex-col gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={`w-fit rounded-md px-2.5 py-1 capitalize ${registrationStatusClassName(
                                                            registration.registration_status,
                                                        )}`}
                                                    >
                                                        {
                                                            registration.registration_status
                                                        }
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className="w-fit rounded-md border-slate-200 bg-slate-50 px-2.5 py-1 capitalize text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                                    >
                                                        {registration.payment_status}
                                                    </Badge>
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
                            meta={registrations.meta}
                            rowsPerPage={filters.per_page}
                            rowOptions={perPageOptions}
                            onRowsPerPageChange={updatePerPage}
                            onPageChange={changePage}
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
        </AppLayout>
    );
}
