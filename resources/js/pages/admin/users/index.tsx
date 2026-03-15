import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import DataTablePagination from '@/components/data-table-pagination';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
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

                <div className={elevatedIndexTableStyles.shell}>
                    <div className={elevatedIndexTableStyles.band}>
                        <DataTableToolbar
                            searchValue={search}
                            onSearchValueChange={setSearch}
                            onSubmit={submitSearch}
                            placeholder="Search name, email, role, or scope"
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
                                    <Link href={UserController.create()}>
                                        New user
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
                                    User
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Role
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Scope
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Status
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
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
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
                                                        ? 'No user accounts yet.'
                                                        : `No users matched "${filters.search}".`}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
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
                                            className={elevatedIndexTableStyles.row}
                                        >
                                            <td className={elevatedIndexTableStyles.firstCell}>
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {user.name}
                                            </div>
                                            <div className={elevatedIndexTableStyles.secondaryText}>
                                                {user.email}
                                            </div>
                                            {user.is_current_user && (
                                                <div className="mt-2">
                                                    <DataTableBadge
                                                        tone="slate"
                                                        capitalize={false}
                                                    >
                                                        Current account
                                                    </DataTableBadge>
                                                </div>
                                            )}
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <DataTableBadge
                                                tone={resolveDataTableTone(
                                                    user.role.name,
                                                    {
                                                        Admin: 'slate',
                                                        Manager: 'emerald',
                                                        'Registration Staff':
                                                            'blue',
                                                        'Online Registrant':
                                                            'violet',
                                                    },
                                                    'slate',
                                                )}
                                                capitalize={false}
                                            >
                                                {user.role.name ?? 'No role'}
                                            </DataTableBadge>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {user.scope_summary}
                                            </div>
                                            {user.pastor && (
                                                <div className={elevatedIndexTableStyles.metaText}>
                                                    {user.pastor.district_name}
                                                </div>
                                            )}
                                            {! user.pastor && user.section && (
                                                <div className={elevatedIndexTableStyles.metaText}>
                                                    {user.section.district_name}
                                                </div>
                                            )}
                                            {user.pastor && (
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.subMetaText
                                                    }
                                                >
                                                    {user.pastor.section_name}
                                                </div>
                                            )}
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <DataTableBadge
                                                tone={resolveDataTableTone(
                                                    user.status,
                                                    {
                                                        active: 'emerald',
                                                        inactive: 'rose',
                                                    },
                                                )}
                                            >
                                                {user.status}
                                            </DataTableBadge>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.lastCellRight} text-right`}
                                            >
                                            <div className={elevatedIndexTableStyles.actionGroup}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-md"
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
                                                        className="rounded-md"
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
                                                        className="rounded-md"
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

                    <div className={elevatedIndexTableStyles.paginationWrapper}>
                        <DataTablePagination
                            meta={users.meta}
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
