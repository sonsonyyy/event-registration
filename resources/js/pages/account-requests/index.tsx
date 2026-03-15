import { Head, router, usePage } from '@inertiajs/react';
import { BadgeCheck, CircleX, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import RegistrantApprovalController from '@/actions/App/Http/Controllers/RegistrantApprovalController';
import DataTablePagination from '@/components/data-table-pagination';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatSystemDateTime as formatManilaDateTime } from '@/lib/date-time';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData } from '@/types';

type StatusOption = {
    value: string;
    label: string;
};

type AccountRequestRecord = {
    id: number;
    name: string;
    email: string;
    status: string;
    approval_status: string;
    created_at: string | null;
    approval_reviewed_at: string | null;
    approval_reviewer: {
        id: number;
        name: string;
    } | null;
    pastor: {
        id: number;
        pastor_name: string;
        church_name: string;
        section_name: string | null;
        district_name: string | null;
    } | null;
};

type Props = {
    scopeSummary: string;
    summary: {
        pending: number;
        approved: number;
        rejected: number;
    };
    requests: PaginatedData<AccountRequestRecord>;
    filters: {
        search: string;
        status: string;
        per_page: number;
    };
    statusOptions: StatusOption[];
    perPageOptions: number[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Account Requests',
        href: RegistrantApprovalController.index(),
    },
];

const formatDateTime = (value: string | null): string => {
    if (!value) {
        return 'Not reviewed yet';
    }

    return formatManilaDateTime(value);
};

const approvalStatusClassName = (status: string): string => {
    switch (status) {
        case 'approved':
            return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300';
        case 'rejected':
            return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300';
        default:
            return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-300';
    }
};

export default function AccountRequestsIndex({
    scopeSummary,
    summary,
    requests,
    filters,
    statusOptions,
    perPageOptions,
}: Props) {
    const page = usePage();
    const flash = page.props.flash as
        | {
              success?: string | null;
              error?: string | null;
          }
        | undefined;
    const errors = page.props.errors as
        | {
              decision?: string;
          }
        | undefined;
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    useEffect(() => {
        setStatus(filters.status);
    }, [filters.status]);

    const visitIndex = (query: {
        search?: string;
        status: string;
        per_page: number;
        page?: number;
    }): void => {
        router.get(RegistrantApprovalController.index.url({ query }), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const reviewRequest = (
        accountRequest: AccountRequestRecord,
        decision: 'approved' | 'rejected',
    ): void => {
        const confirmationMessage =
            decision === 'approved'
                ? `Approve ${accountRequest.name}'s registrant access?`
                : `Reject ${accountRequest.name}'s registrant access?`;

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        router.patch(
            RegistrantApprovalController.update.url(accountRequest.id),
            {
                decision,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const errorMessage = flash?.error ?? errors?.decision ?? null;
    const summaryCards = [
        {
            title: 'Pending Requests',
            value: summary.pending,
            subtitle: 'Awaiting account approval',
            icon: Clock3,
            cardClassName:
                'border border-[#eadfca] border-t-4 border-t-[#c58b1e] bg-white shadow-[#c58b1e]/8 dark:border-amber-950/60 dark:border-t-amber-500 dark:bg-slate-950',
            iconWrapperClassName:
                'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        },
        {
            title: 'Approved',
            value: summary.approved,
            subtitle: 'Online registration unlocked',
            icon: BadgeCheck,
            cardClassName:
                'border border-[#d6e2de] border-t-4 border-t-[#184d47] bg-white shadow-[#184d47]/8 dark:border-emerald-950/60 dark:border-t-emerald-500 dark:bg-slate-950',
            iconWrapperClassName:
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        },
        {
            title: 'Rejected',
            value: summary.rejected,
            subtitle: 'Needs follow-up',
            icon: CircleX,
            cardClassName:
                'border border-[#ecd7d8] border-t-4 border-t-[#be4b56] bg-white shadow-[#be4b56]/8 dark:border-rose-950/60 dark:border-t-rose-500 dark:bg-slate-950',
            iconWrapperClassName:
                'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
        },
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Account Requests" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Registrant account requests"
                    description={`Review church representative account requests within ${scopeSummary}.`}
                />

                <div className="grid gap-4 xl:grid-cols-3">
                    {summaryCards.map((card) => (
                        <div
                            key={card.title}
                            className={`rounded-md px-5 py-5 shadow-sm ${card.cardClassName}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500 dark:text-slate-400">
                                        {card.title}
                                    </div>
                                    <div className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-slate-100">
                                        {card.value}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        {card.subtitle}
                                    </div>
                                </div>

                                <div
                                    className={`flex size-11 items-center justify-center rounded-md ${card.iconWrapperClassName}`}
                                >
                                    <card.icon className="size-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {flash?.success && (
                    <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-100">
                        {flash.success}
                    </div>
                )}

                {errorMessage && (
                    <div className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/70 dark:text-rose-100">
                        {errorMessage}
                    </div>
                )}

                <div className={elevatedIndexTableStyles.shell}>
                    <div className={elevatedIndexTableStyles.band}>
                        <DataTableToolbar
                            searchValue={search}
                            onSearchValueChange={setSearch}
                            onSubmit={() =>
                                visitIndex({
                                    search: search.trim() || undefined,
                                    status,
                                    per_page: filters.per_page,
                                    page: 1,
                                })
                            }
                            placeholder="Search representative, email, church, pastor, or section"
                            className={elevatedIndexTableStyles.toolbar}
                            searchWrapperClassName={
                                elevatedIndexTableStyles.searchWrapper
                            }
                            inputClassName={elevatedIndexTableStyles.input}
                            actionClassName={elevatedIndexTableStyles.action}
                            action={
                                <div className="flex w-full sm:w-auto">
                                    <Select
                                        value={status}
                                        onValueChange={(value) => {
                                            setStatus(value);
                                            visitIndex({
                                                search:
                                                    search.trim() || undefined,
                                                status: value,
                                                per_page: filters.per_page,
                                                page: 1,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-11 w-full min-w-52 rounded-md border-slate-200 bg-white px-4 text-slate-700 shadow-none data-[placeholder]:text-slate-400 focus-visible:border-[#184d47]/35 focus-visible:ring-[#184d47]/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:data-[placeholder]:text-slate-500">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            align="end"
                                            className="rounded-md border-slate-200 bg-white p-1 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            {statusOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className="rounded-sm px-3 py-2.5 text-slate-900 focus:bg-slate-100 focus:text-slate-900 dark:text-slate-100 dark:focus:bg-slate-800 dark:focus:text-white"
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            }
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
                                        Requester
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Church
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Requested
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
                                {requests.data.length === 0 ? (
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
                                                        ? 'No registrant account requests matched the current filter.'
                                                        : `No account requests matched "${filters.search}".`}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    Adjust the search term or change the status filter to review a different queue segment.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.data.map((accountRequest) => (
                                        <tr
                                            key={accountRequest.id}
                                            className={elevatedIndexTableStyles.row}
                                        >
                                            <td
                                                className={
                                                    elevatedIndexTableStyles.firstCell
                                                }
                                            >
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {accountRequest.name}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {accountRequest.email}
                                                </div>
                                            </td>
                                            <td
                                                className={
                                                    elevatedIndexTableStyles.cell
                                                }
                                            >
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {accountRequest.pastor
                                                        ?.church_name ??
                                                        'No church assigned'}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {accountRequest.pastor
                                                        ?.pastor_name ??
                                                        'No pastor assigned'}
                                                </div>
                                                <div className="mt-3 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                    {accountRequest.pastor
                                                        ?.district_name ??
                                                        'No district'}
                                                </div>
                                                <div className="mt-1 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                    {accountRequest.pastor
                                                        ?.section_name ??
                                                        'No section'}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-sm text-slate-500 dark:text-slate-400`}
                                            >
                                                <div>
                                                    Submitted{' '}
                                                    {formatDateTime(
                                                        accountRequest.created_at,
                                                    )}
                                                </div>
                                                <div className="mt-3">
                                                    {accountRequest.approval_reviewer ? (
                                                        <>
                                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                Reviewed by{' '}
                                                                {
                                                                    accountRequest
                                                                        .approval_reviewer
                                                                        .name
                                                                }
                                                            </div>
                                                            <div className="mt-1">
                                                                {formatDateTime(
                                                                    accountRequest.approval_reviewed_at,
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div>
                                                            Waiting for reviewer action
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td
                                                className={
                                                    elevatedIndexTableStyles.cell
                                                }
                                            >
                                                <div className="flex flex-col gap-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={`w-fit rounded-md px-2.5 py-1 capitalize ${approvalStatusClassName(
                                                            accountRequest.approval_status,
                                                        )}`}
                                                    >
                                                        {
                                                            accountRequest.approval_status
                                                        }
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            accountRequest.status ===
                                                            'active'
                                                                ? 'secondary'
                                                                : 'destructive'
                                                        }
                                                        className="w-fit capitalize"
                                                    >
                                                        {accountRequest.status}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.lastCellRight} text-right`}
                                            >
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="rounded-md bg-[#184d47] text-white hover:bg-[#143f3a]"
                                                        onClick={() =>
                                                            reviewRequest(
                                                                accountRequest,
                                                                'approved',
                                                            )
                                                        }
                                                        disabled={
                                                            accountRequest.approval_status ===
                                                            'approved'
                                                        }
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-md border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-200"
                                                        onClick={() =>
                                                            reviewRequest(
                                                                accountRequest,
                                                                'rejected',
                                                            )
                                                        }
                                                        disabled={
                                                            accountRequest.approval_status ===
                                                            'rejected'
                                                        }
                                                    >
                                                        Reject
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
                            meta={requests.meta}
                            rowsPerPage={filters.per_page}
                            rowOptions={perPageOptions}
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
                            onRowsPerPageChange={(value) =>
                                visitIndex({
                                    search: filters.search || undefined,
                                    status: filters.status,
                                    per_page: value,
                                    page: 1,
                                })
                            }
                            onPageChange={(pageNumber) =>
                                visitIndex({
                                    search: filters.search || undefined,
                                    status: filters.status,
                                    per_page: filters.per_page,
                                    page: pageNumber,
                                })
                            }
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
