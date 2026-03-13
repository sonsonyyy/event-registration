import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PastorController from '@/actions/App/Http/Controllers/Admin/PastorController';
import DataTablePagination from '@/components/data-table-pagination';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData } from '@/types';

type Pastor = {
    id: number;
    pastor_name: string;
    church_name: string;
    contact_number: string;
    email: string | null;
    address: string | null;
    status: string;
    section: {
        id: number;
        name: string;
    };
    district: {
        id: number;
        name: string;
    };
};

type Props = {
    pastors: PaginatedData<Pastor>;
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
        title: 'Pastors',
        href: PastorController.index(),
    },
];

export default function PastorIndex({
    pastors,
    filters,
    perPageOptions,
}: Props) {
    const page = usePage();
    const flash = page.props.flash as { success?: string | null } | undefined;
    const [search, setSearch] = useState(filters.search);

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    const destroy = (pastor: Pastor): void => {
        if (! window.confirm(`Delete "${pastor.church_name}" and its pastor record?`)) {
            return;
        }

        router.delete(PastorController.destroy.url(pastor.id), {
            preserveScroll: true,
        });
    };

    const visitIndex = (query: {
        search?: string;
        per_page: number;
        page?: number;
    }): void => {
        router.get(PastorController.index.url({ query }), {}, {
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
            <Head title="Pastors" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Pastors and churches"
                    description="Maintain the pastor and church records used by onsite staff and online registrants."
                    className="mb-4"
                />

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                        {flash.success}
                    </div>
                )}

                <DataTableToolbar
                    searchValue={search}
                    onSearchValueChange={setSearch}
                    onSubmit={submitSearch}
                    placeholder="Search church, pastor, contact number, or email"
                    action={(
                        <Button asChild className="h-11 rounded-xl">
                            <Link href={PastorController.create()}>
                                New pastor record
                            </Link>
                        </Button>
                    )}
                />

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                        <thead className="bg-muted/40">
                            <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                <th className="py-2.5 pr-3 pl-4 font-medium">
                                    Church
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Section
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Contact
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Status
                                </th>
                                <th className="py-2.5 pr-4 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border/50">
                            {pastors.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-14 text-center"
                                    >
                                        <div className="space-y-2">
                                            <div className="text-base font-medium">
                                                {filters.search === ''
                                                    ? 'No pastor records yet.'
                                                    : `No pastors matched "${filters.search}".`}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {filters.search === ''
                                                    ? 'Create the first pastor and church record to populate the directory.'
                                                    : 'Try another church name, pastor name, contact number, or email address.'}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pastors.data.map((pastor) => (
                                    <tr
                                        key={pastor.id}
                                        className="bg-background transition-colors hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3.5 align-middle">
                                            <div className="font-medium text-foreground">
                                                {pastor.church_name}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {pastor.pastor_name}
                                            </div>
                                            <div className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                                                {pastor.address ||
                                                    'No address provided.'}
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle">
                                            <div className="font-medium text-foreground">
                                                {pastor.section.name}
                                            </div>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                {pastor.district.name}
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle text-sm text-muted-foreground">
                                            <div className="font-medium text-foreground/90">
                                                {pastor.contact_number}
                                            </div>
                                            <div className="mt-2 break-all">
                                                {pastor.email ||
                                                    'No email provided.'}
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle">
                                            <Badge
                                                variant={
                                                    pastor.status === 'active'
                                                        ? 'secondary'
                                                        : 'destructive'
                                                }
                                                className="capitalize"
                                            >
                                                {pastor.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3.5 pr-4 align-middle">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={PastorController.edit(
                                                            pastor.id,
                                                        )}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() =>
                                                        destroy(pastor)
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

                <DataTablePagination
                    meta={pastors.meta}
                    onPageChange={changePage}
                    rowsPerPage={filters.per_page}
                    rowOptions={perPageOptions}
                    onRowsPerPageChange={updatePerPage}
                />
            </div>
        </AppLayout>
    );
}
