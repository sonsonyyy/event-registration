import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import DataTablePagination from '@/components/data-table-pagination';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData } from '@/types';

type UserRecord = {
    id: number;
    name: string;
    email: string;
    status: string;
    role: {
        id: number | null;
        name: string | null;
    };
    district: {
        id: number;
        name: string;
    } | null;
    section: {
        id: number;
        name: string;
        district_name: string | null;
    } | null;
    pastor: {
        id: number;
        pastor_name: string;
        church_name: string;
        section_name: string | null;
        district_name: string | null;
    } | null;
    scope_summary: string;
    can_delete: boolean;
    is_current_user: boolean;
};

type Props = {
    users: PaginatedData<UserRecord>;
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
        title: 'Users',
        href: UserController.index(),
    },
];

const roleVariant = (roleName: string | null): 'default' | 'secondary' => {
    switch (roleName) {
        case 'Manager':
        case 'Online Registrant':
            return 'secondary';
        default:
            return 'default';
    }
};

export default function UserIndex({
    users,
    filters,
    perPageOptions,
}: Props) {
    const page = usePage();
    const flash = page.props.flash as
        | {
              success?: string | null;
              error?: string | null;
          }
        | undefined;
    const [search, setSearch] = useState(filters.search);

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    const destroy = (user: UserRecord): void => {
        if (
            ! window.confirm(
                `Delete "${user.name}"? Use inactive status instead if this account still has operational history.`,
            )
        ) {
            return;
        }

        router.delete(UserController.destroy.url(user.id), {
            preserveScroll: true,
        });
    };

    const visitIndex = (query: {
        search?: string;
        per_page: number;
        page?: number;
    }): void => {
        router.get(UserController.index.url({ query }), {}, {
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
            <Head title="Users" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Users"
                    description="Manage system accounts, roles, and section or pastor scope assignments."
                    className="mb-4"
                />

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
                        {flash.error}
                    </div>
                )}

                <DataTableToolbar
                    searchValue={search}
                    onSearchValueChange={setSearch}
                    onSubmit={submitSearch}
                    placeholder="Search name, email, role, or scope"
                    action={(
                        <Button asChild className="h-11 rounded-xl">
                            <Link href={UserController.create()}>
                                New user
                            </Link>
                        </Button>
                    )}
                />

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                        <thead className="bg-muted/40">
                            <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                <th className="py-2.5 pr-3 pl-4 font-medium">
                                    User
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Role
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Scope
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
                            {users.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-14 text-center"
                                    >
                                        <div className="space-y-2">
                                            <div className="text-base font-medium">
                                                {filters.search === ''
                                                    ? 'No user accounts yet.'
                                                    : `No users matched "${filters.search}".`}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {filters.search === ''
                                                    ? 'Create the first user account to assign system access.'
                                                    : 'Try another name, email, role, or scope term.'}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="bg-background transition-colors hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3.5 align-middle">
                                            <div className="font-medium text-foreground">
                                                {user.name}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                {user.email}
                                            </div>
                                            {user.is_current_user && (
                                                <div className="mt-2">
                                                    <Badge variant="secondary">
                                                        Current account
                                                    </Badge>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle">
                                            <Badge
                                                variant={roleVariant(
                                                    user.role.name,
                                                )}
                                            >
                                                {user.role.name ?? 'No role'}
                                            </Badge>
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle text-muted-foreground">
                                            <div>{user.scope_summary}</div>
                                            {user.pastor && (
                                                <div className="mt-2 text-xs uppercase tracking-wide">
                                                    {user.pastor.district_name}
                                                </div>
                                            )}
                                            {! user.pastor && user.section && (
                                                <div className="mt-2 text-xs uppercase tracking-wide">
                                                    {user.section.district_name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle">
                                            <Badge
                                                variant={
                                                    user.status === 'active'
                                                        ? 'secondary'
                                                        : 'destructive'
                                                }
                                                className="capitalize"
                                            >
                                                {user.status}
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
                                                        href={UserController.edit(
                                                            user.id,
                                                        )}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                                {user.can_delete ? (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            destroy(user)
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled
                                                    >
                                                        Protected
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <DataTablePagination
                    meta={users.meta}
                    onPageChange={changePage}
                    rowsPerPage={filters.per_page}
                    rowOptions={perPageOptions}
                    onRowsPerPageChange={updatePerPage}
                />
            </div>
        </AppLayout>
    );
}
