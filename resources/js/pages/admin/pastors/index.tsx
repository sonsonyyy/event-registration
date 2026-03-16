import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PastorController from '@/actions/App/Http/Controllers/Admin/PastorController';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import DataTablePagination from '@/components/data-table-pagination';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { successNoticeClassName } from '@/lib/ui-styles';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData } from '@/types';

type Pastor = {
    id: number;
    pastor_name: string;
    church_name: string;
    contact_number: string | null;
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
                            placeholder="Search church, pastor, contact number, or email"
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
                                    <Link href={PastorController.create()}>
                                        New pastor record
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
                                    Church
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Section
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Contact
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
                                {pastors.data.length === 0 ? (
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
                                                        ? 'No pastor records yet.'
                                                        : `No pastors matched "${filters.search}".`}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
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
                                            className={elevatedIndexTableStyles.row}
                                        >
                                            <td className={elevatedIndexTableStyles.firstCell}>
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {pastor.church_name}
                                            </div>
                                            <div className={elevatedIndexTableStyles.secondaryText}>
                                                {pastor.pastor_name}
                                            </div>
                                            <div className={elevatedIndexTableStyles.detailText}>
                                                {pastor.address ||
                                                    'No address provided.'}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {pastor.section.name}
                                            </div>
                                            <div className={elevatedIndexTableStyles.metaText}>
                                                {pastor.district.name}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className={elevatedIndexTableStyles.strongText}>
                                                {pastor.contact_number ||
                                                    'No contact number'}
                                            </div>
                                            <div
                                                className={`${elevatedIndexTableStyles.secondaryText} break-all`}
                                            >
                                                {pastor.email ||
                                                    'No email address'}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <DataTableBadge
                                                tone={resolveDataTableTone(
                                                    pastor.status,
                                                    {
                                                        active: 'emerald',
                                                        inactive: 'rose',
                                                    },
                                                )}
                                            >
                                                {pastor.status}
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
                                                    className="rounded-md"
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

                    <div className={elevatedIndexTableStyles.paginationWrapper}>
                        <DataTablePagination
                            meta={pastors.meta}
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
