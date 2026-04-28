import { Head, router } from '@inertiajs/react';
import { BadgeCheck, CircleX, Clock3 } from 'lucide-react';
import { useState } from 'react';
import RegistrantApprovalController from '@/actions/App/Http/Controllers/RegistrantApprovalController';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import DataTablePagination from '@/components/data-table-pagination';
import {
    elevatedIndexTableStyles,
    reviewWorkspaceStyles,
} from '@/components/data-table-presets';
import DataTableToolbar from '@/components/data-table-toolbar';
import EntityRecordDialog from '@/components/entity-record-dialog';
import Heading from '@/components/heading';
import SummaryStatCards from '@/components/summary-stat-cards';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatSystemDateTime as formatManilaDateTime } from '@/lib/date-time';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData } from '@/types';

type StatusOption = {
    value: string;
    label: string;
};

type SectionOption = {
    id: number;
    name: string;
    district_name: string | null;
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
        section_id: number | null;
        search: string;
        status: string;
        per_page: number;
    };
    sections: SectionOption[];
    statusOptions: StatusOption[];
    perPageOptions: number[];
};

type AccountRequestIndexQuery = {
    section_id?: number;
    search?: string;
    status: string;
    per_page: number;
    page?: number;
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

export default function AccountRequestsIndex({
    scopeSummary,
    summary,
    requests,
    filters,
    sections,
    statusOptions,
    perPageOptions,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [sectionId, setSectionId] = useState(
        filters.section_id !== null ? String(filters.section_id) : 'all',
    );
    const [status, setStatus] = useState(filters.status);
    const [selectedRequest, setSelectedRequest] =
        useState<AccountRequestRecord | null>(null);
    const [pendingReview, setPendingReview] = useState<{
        request: AccountRequestRecord;
        decision: 'approved' | 'rejected';
    } | null>(null);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const buildQuery = ({
        searchValue,
        sectionValue,
        statusValue,
        perPage,
        page,
    }: {
        searchValue: string;
        sectionValue: string;
        statusValue: string;
        perPage: number;
        page?: number;
    }): AccountRequestIndexQuery => {
        const normalizedSearch = searchValue.trim();

        return {
            ...(sectionValue !== 'all'
                ? { section_id: Number(sectionValue) }
                : {}),
            ...(normalizedSearch !== '' ? { search: normalizedSearch } : {}),
            status: statusValue,
            per_page: perPage,
            ...(page !== undefined && page > 1 ? { page } : {}),
        };
    };

    const visitIndex = (query: AccountRequestIndexQuery): void => {
        router.get(
            RegistrantApprovalController.index.url({ query }),
            {},
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            },
        );
    };

    const reviewRequest = (): void => {
        if (pendingReview === null) {
            return;
        }

        setIsSubmittingReview(true);

        router.patch(
            RegistrantApprovalController.update.url(pendingReview.request.id),
            {
                decision: pendingReview.decision,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSubmittingReview(false);
                    setPendingReview(null);
                },
            },
        );
    };
    const summaryCards = [
        {
            title: 'Pending Requests',
            value: summary.pending,
            subtitle: 'Awaiting account approval',
            icon: Clock3,
            cardClassName: reviewWorkspaceStyles.summaryCardPending,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconPending,
        },
        {
            title: 'Approved',
            value: summary.approved,
            subtitle: 'Online registration unlocked',
            icon: BadgeCheck,
            cardClassName: reviewWorkspaceStyles.summaryCardApproved,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconApproved,
        },
        {
            title: 'Rejected',
            value: summary.rejected,
            subtitle: 'Needs follow-up',
            icon: CircleX,
            cardClassName: reviewWorkspaceStyles.summaryCardRejected,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconRejected,
        },
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Account Requests" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-5">
                <Heading
                    title="Registrant account requests"
                    description={`Review church representative account requests within ${scopeSummary}.`}
                />

                <SummaryStatCards
                    gridClassName="grid gap-3 xl:grid-cols-3"
                    items={summaryCards}
                />

                <div className={reviewWorkspaceStyles.shell}>
                    <div className={reviewWorkspaceStyles.band}>
                        <DataTableToolbar
                            searchValue={search}
                            onSearchValueChange={setSearch}
                            onSubmit={() =>
                                visitIndex(
                                    buildQuery({
                                        searchValue: search,
                                        sectionValue: sectionId,
                                        statusValue: status,
                                        perPage: filters.per_page,
                                    }),
                                )
                            }
                            placeholder="Search representative, email, church, pastor, or section"
                            className={reviewWorkspaceStyles.toolbar}
                            searchWrapperClassName={
                                reviewWorkspaceStyles.searchWrapper
                            }
                            inputClassName={reviewWorkspaceStyles.input}
                            actionClassName={reviewWorkspaceStyles.action}
                            action={
                                <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
                                    {sections.length > 0 && (
                                        <Select
                                            value={sectionId}
                                            onValueChange={(value) => {
                                                setSectionId(value);
                                                visitIndex(
                                                    buildQuery({
                                                        searchValue: search,
                                                        sectionValue: value,
                                                        statusValue: status,
                                                        perPage:
                                                            filters.per_page,
                                                    }),
                                                );
                                            }}
                                        >
                                            <SelectTrigger
                                                className={
                                                    reviewWorkspaceStyles.selectTrigger
                                                }
                                            >
                                                <SelectValue placeholder="All sections" />
                                            </SelectTrigger>
                                            <SelectContent
                                                align="end"
                                                className={
                                                    reviewWorkspaceStyles.selectContent
                                                }
                                            >
                                                <SelectItem
                                                    value="all"
                                                    className={
                                                        reviewWorkspaceStyles.selectItem
                                                    }
                                                >
                                                    All sections
                                                </SelectItem>
                                                {sections.map((section) => (
                                                    <SelectItem
                                                        key={section.id}
                                                        value={String(
                                                            section.id,
                                                        )}
                                                        className={
                                                            reviewWorkspaceStyles.selectItem
                                                        }
                                                    >
                                                        {section.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    <Select
                                        value={status}
                                        onValueChange={(value) => {
                                            setStatus(value);
                                            visitIndex(
                                                buildQuery({
                                                    searchValue: search,
                                                    sectionValue: sectionId,
                                                    statusValue: value,
                                                    perPage: filters.per_page,
                                                }),
                                            );
                                        }}
                                    >
                                        <SelectTrigger
                                            className={
                                                reviewWorkspaceStyles.selectTrigger
                                            }
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            align="end"
                                            className={
                                                reviewWorkspaceStyles.selectContent
                                            }
                                        >
                                            {statusOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className={
                                                        reviewWorkspaceStyles.selectItem
                                                    }
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
                                <tr
                                    className={
                                        elevatedIndexTableStyles.headerRow
                                    }
                                >
                                    <th
                                        className={
                                            elevatedIndexTableStyles.firstHeaderCell
                                        }
                                    >
                                        Requester
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Church
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Requested
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
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
                                                    Adjust the search term or
                                                    change the status filter to
                                                    review a different queue
                                                    segment.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.data.map((accountRequest) => (
                                        <tr
                                            key={accountRequest.id}
                                            className={
                                                elevatedIndexTableStyles.row
                                            }
                                        >
                                            <td
                                                className={
                                                    elevatedIndexTableStyles.firstCell
                                                }
                                            >
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {accountRequest.name}
                                                </div>
                                                <div className="mt-1 line-clamp-1 text-[12px] text-slate-500 sm:text-[13px] dark:text-slate-400">
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
                                                <div className="mt-1 line-clamp-1 text-[12px] text-slate-500 sm:text-[13px] dark:text-slate-400">
                                                    {accountRequest.pastor
                                                        ?.pastor_name ??
                                                        'No pastor assigned'}
                                                    {' • '}
                                                    {accountRequest.pastor
                                                        ?.section_name ??
                                                        'No section'}
                                                    {' • '}
                                                    {accountRequest.pastor
                                                        ?.district_name ??
                                                        'No district'}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-[12px] text-slate-500 sm:text-[13px] dark:text-slate-400`}
                                            >
                                                <div>
                                                    Submitted{' '}
                                                    {formatDateTime(
                                                        accountRequest.created_at,
                                                    )}
                                                </div>
                                                <div className="mt-1.5">
                                                    {accountRequest.approval_reviewer ? (
                                                        <div className="line-clamp-2">
                                                            Reviewed by{' '}
                                                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                                                {
                                                                    accountRequest
                                                                        .approval_reviewer
                                                                        .name
                                                                }
                                                            </span>
                                                            {' • '}
                                                            {formatDateTime(
                                                                accountRequest.approval_reviewed_at,
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            Waiting for reviewer
                                                            action
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td
                                                className={
                                                    elevatedIndexTableStyles.cell
                                                }
                                            >
                                                <div className="flex flex-wrap gap-1.5">
                                                    <DataTableBadge
                                                        tone={resolveDataTableTone(
                                                            accountRequest.approval_status,
                                                            {
                                                                approved:
                                                                    'emerald',
                                                                rejected:
                                                                    'rose',
                                                                pending:
                                                                    'amber',
                                                            },
                                                        )}
                                                        className="w-fit rounded-md capitalize"
                                                    >
                                                        {
                                                            accountRequest.approval_status
                                                        }
                                                    </DataTableBadge>
                                                    <DataTableBadge
                                                        tone={
                                                            accountRequest.status ===
                                                            'active'
                                                                ? 'emerald'
                                                                : 'rose'
                                                        }
                                                        className="w-fit rounded-md capitalize"
                                                    >
                                                        {accountRequest.status}
                                                    </DataTableBadge>
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.lastCellRight} text-right`}
                                            >
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className={
                                                        reviewWorkspaceStyles.surfaceButton
                                                    }
                                                    onClick={() =>
                                                        setSelectedRequest(
                                                            accountRequest,
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

                    <div className={reviewWorkspaceStyles.paginationWrapper}>
                        <DataTablePagination
                            meta={requests.meta}
                            rowsPerPage={filters.per_page}
                            rowOptions={perPageOptions}
                            className={reviewWorkspaceStyles.pagination}
                            topRowClassName={
                                reviewWorkspaceStyles.paginationTopRow
                            }
                            rowsTriggerClassName={
                                reviewWorkspaceStyles.rowsTrigger
                            }
                            summaryClassName={reviewWorkspaceStyles.summary}
                            navigationWrapperClassName={
                                reviewWorkspaceStyles.navigationWrapper
                            }
                            previousButtonClassName={
                                reviewWorkspaceStyles.previousButton
                            }
                            nextButtonClassName={
                                reviewWorkspaceStyles.nextButton
                            }
                            activePageButtonClassName={
                                reviewWorkspaceStyles.activePageButton
                            }
                            inactivePageButtonClassName={
                                reviewWorkspaceStyles.inactivePageButton
                            }
                            ellipsisClassName={reviewWorkspaceStyles.ellipsis}
                            onRowsPerPageChange={(value) =>
                                visitIndex(
                                    buildQuery({
                                        searchValue: filters.search,
                                        sectionValue:
                                            filters.section_id !== null
                                                ? String(filters.section_id)
                                                : 'all',
                                        statusValue: filters.status,
                                        perPage: value,
                                    }),
                                )
                            }
                            onPageChange={(pageNumber) =>
                                visitIndex(
                                    buildQuery({
                                        searchValue: filters.search,
                                        sectionValue:
                                            filters.section_id !== null
                                                ? String(filters.section_id)
                                                : 'all',
                                        statusValue: filters.status,
                                        perPage: filters.per_page,
                                        page: pageNumber,
                                    }),
                                )
                            }
                        />
                    </div>
                </div>

                <EntityRecordDialog
                    open={selectedRequest !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedRequest(null);
                        }
                    }}
                    title={
                        selectedRequest
                            ? `Account request #${selectedRequest.id}`
                            : 'Account request'
                    }
                    description="Review the representative details, assigned church scope, and approval history."
                    badges={
                        selectedRequest ? (
                            <>
                                <DataTableBadge
                                    tone={resolveDataTableTone(
                                        selectedRequest.approval_status,
                                        {
                                            approved: 'emerald',
                                            rejected: 'rose',
                                            pending: 'amber',
                                        },
                                    )}
                                >
                                    {selectedRequest.approval_status}
                                </DataTableBadge>
                                <DataTableBadge
                                    tone={
                                        selectedRequest.status === 'active'
                                            ? 'emerald'
                                            : 'rose'
                                    }
                                >
                                    {selectedRequest.status}
                                </DataTableBadge>
                            </>
                        ) : null
                    }
                    sections={
                        selectedRequest
                            ? [
                                  {
                                      title: 'Representative',
                                      fields: [
                                          {
                                              label: 'Name',
                                              value: selectedRequest.name,
                                          },
                                          {
                                              label: 'Email',
                                              value: selectedRequest.email,
                                              breakWords: true,
                                          },
                                      ],
                                  },
                                  {
                                      title: 'Church Scope',
                                      fields: [
                                          {
                                              label: 'Church',
                                              value:
                                                  selectedRequest.pastor
                                                      ?.church_name ??
                                                  'No church assigned',
                                          },
                                          {
                                              label: 'Pastor',
                                              value:
                                                  selectedRequest.pastor
                                                      ?.pastor_name ??
                                                  'No pastor assigned',
                                          },
                                          {
                                              label: 'District',
                                              value:
                                                  selectedRequest.pastor
                                                      ?.district_name ??
                                                  'No district',
                                          },
                                          {
                                              label: 'Section',
                                              value:
                                                  selectedRequest.pastor
                                                      ?.section_name ??
                                                  'No section',
                                          },
                                      ],
                                  },
                                  {
                                      title: 'Review Timeline',
                                      fields: [
                                          {
                                              label: 'Requested',
                                              value: formatDateTime(
                                                  selectedRequest.created_at,
                                              ),
                                          },
                                          {
                                              label: 'Reviewed',
                                              value: selectedRequest.approval_reviewer ? (
                                                  <>
                                                      <div>
                                                          {
                                                              selectedRequest
                                                                  .approval_reviewer
                                                                  .name
                                                          }
                                                      </div>
                                                      <div className="text-slate-500 dark:text-slate-400">
                                                          {formatDateTime(
                                                              selectedRequest.approval_reviewed_at,
                                                          )}
                                                      </div>
                                                  </>
                                              ) : (
                                                  'Waiting for reviewer action'
                                              ),
                                          },
                                      ],
                                  },
                              ]
                            : []
                    }
                    footer={
                        selectedRequest ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedRequest(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    className={
                                        reviewWorkspaceStyles.primaryButton
                                    }
                                    onClick={() => {
                                        const request = selectedRequest;
                                        setSelectedRequest(null);
                                        setPendingReview({
                                            request,
                                            decision: 'approved',
                                        });
                                    }}
                                    disabled={
                                        selectedRequest.approval_status ===
                                        'approved'
                                    }
                                >
                                    Approve
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={
                                        reviewWorkspaceStyles.dangerButton
                                    }
                                    onClick={() => {
                                        const request = selectedRequest;
                                        setSelectedRequest(null);
                                        setPendingReview({
                                            request,
                                            decision: 'rejected',
                                        });
                                    }}
                                    disabled={
                                        selectedRequest.approval_status ===
                                        'rejected'
                                    }
                                >
                                    Reject
                                </Button>
                            </div>
                        ) : null
                    }
                />

                <ConfirmActionDialog
                    open={pendingReview !== null}
                    onOpenChange={(open) => {
                        if (!open && !isSubmittingReview) {
                            setPendingReview(null);
                        }
                    }}
                    title={
                        pendingReview?.decision === 'approved'
                            ? 'Approve registrant account'
                            : 'Reject registrant account'
                    }
                    description={
                        pendingReview?.decision === 'approved'
                            ? 'This will unlock online registration for the representative.'
                            : 'This will keep the account request out of the approved access list.'
                    }
                    confirmLabel={
                        pendingReview?.decision === 'approved'
                            ? 'Approve account'
                            : 'Reject account'
                    }
                    confirmVariant={
                        pendingReview?.decision === 'approved'
                            ? 'default'
                            : 'destructive'
                    }
                    processing={isSubmittingReview}
                    details={
                        pendingReview ? (
                            <>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                    {pendingReview.request.name}
                                </div>
                                <div>{pendingReview.request.email}</div>
                                <div>
                                    {pendingReview.request.pastor
                                        ?.church_name ?? 'No church assigned'}
                                </div>
                            </>
                        ) : undefined
                    }
                    onConfirm={reviewRequest}
                />
            </div>
        </AppLayout>
    );
}
