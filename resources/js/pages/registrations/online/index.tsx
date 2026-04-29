import { Head, Link, router } from '@inertiajs/react';
import { Ban, Eye, FileSearch, Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import AssignedChurchCard from '@/components/assigned-church-card';
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
import Heading from '@/components/heading';
import RegistrationRecordDialog from '@/components/registration-record-dialog';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatSystemDateTime } from '@/lib/date-time';
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
    submitted_by_name: string | null;
    event: {
        id: number;
        name: string;
        venue: string;
        scope_label: string;
        department_name: string | null;
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
    can_cancel: boolean;
    latest_review: {
        id: number;
        decision: string;
        reason: string | null;
        notes: string | null;
        decided_at: string | null;
        reviewer: {
            id: number;
            name: string;
        } | null;
    } | null;
    receipt: {
        original_name: string | null;
        uploaded_at: string | null;
        url: string | null;
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
    if (!value) {
        return 'Not submitted';
    }

    return formatSystemDateTime(value);
};

const onlineRegistrationTableClassName = `${elevatedIndexTableStyles.table} min-w-[90rem]`;

export default function OnlineRegistrationIndex({
    assignedPastor,
    registrations,
    filters,
    perPageOptions,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [selectedRegistration, setSelectedRegistration] =
        useState<RegistrationRecord | null>(null);
    const [registrationToCancel, setRegistrationToCancel] =
        useState<RegistrationRecord | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const visitIndex = (query: {
        search?: string;
        per_page: number;
        page?: number;
    }): void => {
        router.get(
            OnlineRegistrationController.index.url({ query }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
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

    const cancelRegistration = (): void => {
        if (registrationToCancel === null) {
            return;
        }

        setIsCancelling(true);

        router.patch(
            OnlineRegistrationController.cancel(registrationToCancel.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsCancelling(false);
                    setRegistrationToCancel(null);
                },
            },
        );
    };

    const closeDetails = (): void => {
        setSelectedRegistration(null);
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
                            action={
                                <Button
                                    asChild
                                    className={
                                        reviewWorkspaceStyles.primaryButton
                                    }
                                >
                                    <Link
                                        href={OnlineRegistrationController.create()}
                                    >
                                        <Plus className="size-4" />
                                        New online registration
                                    </Link>
                                </Button>
                            }
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className={onlineRegistrationTableClassName}>
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
                                        Transaction
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Event
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Scope / Department
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Items
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Total
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Receipt
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
                                {registrations.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
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
                                            className={
                                                elevatedIndexTableStyles.row
                                            }
                                        >
                                            <td
                                                className={`${elevatedIndexTableStyles.firstCell} min-w-[12rem]`}
                                            >
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {registration.submitted_by_name
                                                        ? `By ${registration.submitted_by_name}`
                                                        : 'Submitted online'}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {formatDate(
                                                        registration.submitted_at,
                                                    )}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[14rem]`}
                                            >
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {registration.event.name}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {registration.event.venue}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[12rem]`}
                                            >
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {
                                                        registration.event
                                                            .scope_label
                                                    }
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {registration.event
                                                        .department_name ??
                                                        'No department'}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[16rem]`}
                                            >
                                                <div className="space-y-2">
                                                    {registration.items.map(
                                                        (item) => (
                                                            <div
                                                                key={item.id}
                                                                className="text-sm text-slate-500 dark:text-slate-400"
                                                            >
                                                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                                                    {
                                                                        item.category_name
                                                                    }
                                                                </span>{' '}
                                                                ×{' '}
                                                                {item.quantity}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[10rem]`}
                                            >
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {formatCurrency(
                                                        registration.total_amount,
                                                    )}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {
                                                        registration.total_quantity
                                                    }{' '}
                                                    delegates
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[12rem]`}
                                            >
                                                {registration.payment_reference ? (
                                                    <DataTableBadge
                                                        tone="slate"
                                                        capitalize={false}
                                                        className="font-mono font-semibold tracking-[0.04em]"
                                                    >
                                                        Ref.{' '}
                                                        {
                                                            registration.payment_reference
                                                        }
                                                    </DataTableBadge>
                                                ) : (
                                                    <div
                                                        className={
                                                            elevatedIndexTableStyles.secondaryText
                                                        }
                                                    >
                                                        Reference not provided
                                                    </div>
                                                )}
                                                {registration.receipt.url ? (
                                                    <div className="mt-2">
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                            className={
                                                                reviewWorkspaceStyles.surfaceButton
                                                            }
                                                        >
                                                            <a
                                                                href={
                                                                    registration
                                                                        .receipt
                                                                        .url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <FileSearch className="size-4" />
                                                                View receipt
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[15rem]`}
                                            >
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <DataTableBadge
                                                        tone={resolveDataTableTone(
                                                            registration.registration_status,
                                                            {
                                                                verified:
                                                                    'emerald',
                                                                'needs correction':
                                                                    'amber',
                                                                completed:
                                                                    'emerald',
                                                                rejected:
                                                                    'rose',
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
                                                    <DataTableBadge
                                                        tone={resolveDataTableTone(
                                                            registration.payment_status,
                                                            {
                                                                paid: 'emerald',
                                                                unpaid: 'rose',
                                                                partial:
                                                                    'amber',
                                                            },
                                                        )}
                                                    >
                                                        {
                                                            registration.payment_status
                                                        }
                                                    </DataTableBadge>
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.lastCellRight} min-w-[8rem] text-right`}
                                            >
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className={
                                                        reviewWorkspaceStyles.surfaceButton
                                                    }
                                                    onClick={() =>
                                                        setSelectedRegistration(
                                                            registration,
                                                        )
                                                    }
                                                >
                                                    <Eye className="size-4" />
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
                            ellipsisClassName={
                                elevatedIndexTableStyles.ellipsis
                            }
                        />
                    </div>
                </div>

                <RegistrationRecordDialog
                    open={selectedRegistration !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDetails();
                        }
                    }}
                    title={
                        selectedRegistration
                            ? `Online registration #${selectedRegistration.id}`
                            : 'Online registration'
                    }
                    description="Review the full record, submitted quantities, receipt details, and the latest verification feedback."
                    registrationStatus={
                        selectedRegistration?.registration_status ?? 'draft'
                    }
                    paymentStatus={selectedRegistration?.payment_status ?? null}
                    totalQuantity={selectedRegistration?.total_quantity ?? 0}
                    totalAmount={selectedRegistration?.total_amount ?? '0.00'}
                    event={
                        selectedRegistration?.event ?? {
                            name: '',
                            venue: '',
                        }
                    }
                    pastor={
                        selectedRegistration?.pastor ?? {
                            church_name: '',
                            pastor_name: '',
                            section_name: '',
                            district_name: '',
                        }
                    }
                    submittedAt={selectedRegistration?.submitted_at}
                    paymentReference={selectedRegistration?.payment_reference}
                    remarks={selectedRegistration?.remarks}
                    receipt={selectedRegistration?.receipt}
                    items={selectedRegistration?.items ?? []}
                    reviews={
                        selectedRegistration?.latest_review
                            ? [selectedRegistration.latest_review]
                            : []
                    }
                    footer={
                        selectedRegistration ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeDetails}
                                >
                                    <X className="size-4" />
                                    Close
                                </Button>
                                {selectedRegistration.can_edit && (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className={
                                            reviewWorkspaceStyles.surfaceButton
                                        }
                                    >
                                        <Link
                                            href={OnlineRegistrationController.edit(
                                                selectedRegistration.id,
                                            )}
                                        >
                                            <Pencil className="size-4" />
                                            Edit registration
                                        </Link>
                                    </Button>
                                )}
                                {selectedRegistration.can_cancel && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={
                                            reviewWorkspaceStyles.surfaceButton
                                        }
                                        onClick={() => {
                                            closeDetails();
                                            setRegistrationToCancel(
                                                selectedRegistration,
                                            );
                                        }}
                                    >
                                        <Ban className="size-4" />
                                        Cancel registration
                                    </Button>
                                )}
                            </div>
                        ) : null
                    }
                />

                <ConfirmActionDialog
                    open={registrationToCancel !== null}
                    onOpenChange={(open) => {
                        if (!open && !isCancelling) {
                            setRegistrationToCancel(null);
                        }
                    }}
                    title="Cancel online registration"
                    description="This will stop the registration from being reviewed and keep it out of the active submission queue."
                    confirmLabel="Cancel registration"
                    confirmVariant="destructive"
                    processing={isCancelling}
                    details={
                        registrationToCancel ? (
                            <>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                    #{registrationToCancel.id} ·{' '}
                                    {registrationToCancel.event.name}
                                </div>
                                <div>
                                    {registrationToCancel.total_quantity}{' '}
                                    delegates ·{' '}
                                    {formatCurrency(
                                        registrationToCancel.total_amount,
                                    )}
                                </div>
                            </>
                        ) : undefined
                    }
                    onConfirm={cancelRegistration}
                />
            </div>
        </AppLayout>
    );
}
