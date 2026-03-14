import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import AssignedChurchCard from '@/components/assigned-church-card';
import DataTablePagination from '@/components/data-table-pagination';
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

const registrationStatusVariant = (
    status: string,
): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
        case 'verified':
        case 'completed':
            return 'secondary';
        case 'rejected':
        case 'cancelled':
            return 'destructive';
        default:
            return 'default';
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

                <DataTableToolbar
                    searchValue={search}
                    onSearchValueChange={setSearch}
                    onSubmit={submitSearch}
                    placeholder="Search event, venue, reference, or uploaded receipt"
                    action={(
                        <Button asChild className="h-11 rounded-xl">
                            <Link href={OnlineRegistrationController.create()}>
                                New online registration
                            </Link>
                        </Button>
                    )}
                />

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                        <thead className="bg-muted/40">
                            <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                <th className="py-2.5 pr-3 pl-4 font-medium">
                                    Transaction
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Event
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Items
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Total
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Receipt
                                </th>
                                <th className="py-2.5 pr-4 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border/50">
                            {registrations.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-14 text-center"
                                    >
                                        <div className="space-y-2">
                                            <div className="text-base font-medium">
                                                {filters.search === ''
                                                    ? 'No online registrations yet.'
                                                    : `No registrations matched "${filters.search}".`}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
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
                                        className="bg-background transition-colors hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3.5 align-middle">
                                            <div className="font-medium text-foreground">
                                                #{registration.id}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {formatDate(
                                                    registration.submitted_at,
                                                )}
                                            </div>
                                            {registration.payment_reference && (
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    Ref: {registration.payment_reference}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle">
                                            <div className="font-medium text-foreground">
                                                {registration.event.name}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {registration.event.venue}
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle">
                                            <div className="space-y-2">
                                                {registration.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="text-sm text-muted-foreground"
                                                    >
                                                        <span className="font-medium text-foreground">
                                                            {item.category_name}
                                                        </span>{' '}
                                                        × {item.quantity}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle">
                                            <div className="font-medium text-foreground">
                                                {formatCurrency(
                                                    registration.total_amount,
                                                )}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {registration.total_quantity}{' '}
                                                delegates
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle">
                                            <div className="font-medium text-foreground">
                                                {registration.receipt.original_name ??
                                                    'No receipt uploaded'}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {formatDate(
                                                    registration.receipt.uploaded_at,
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-4 align-middle">
                                            <div className="flex flex-col gap-2">
                                                <Badge
                                                    variant={registrationStatusVariant(
                                                        registration.registration_status,
                                                    )}
                                                    className="w-fit capitalize"
                                                >
                                                    {
                                                        registration.registration_status
                                                    }
                                                </Badge>
                                                <Badge
                                                    variant="default"
                                                    className="w-fit capitalize"
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

                <DataTablePagination
                    meta={registrations.meta}
                    rowsPerPage={filters.per_page}
                    rowOptions={perPageOptions}
                    onRowsPerPageChange={updatePerPage}
                    onPageChange={changePage}
                />
            </div>
        </AppLayout>
    );
}
