import { Head, Link, router } from '@inertiajs/react';
import { Ban, Eye, Pencil, Plus, ReceiptText, X } from 'lucide-react';
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
    event_bank_account: {
        id: number;
        bank_name: string;
        account_name: string;
        account_number: string;
        qr_code_url: string | null;
        status: string;
    } | null;
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

const onlineRegistrationTableClassName = `${elevatedIndexTableStyles.table} min-w-[112rem] table-auto`;

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
                                        elevatedIndexTableStyles.primaryButton
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
                                        Event Name
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
                                        Pastor
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Submitted By
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Bank/Wallet
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Receipt
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                    >
                                        Delegates
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                    >
                                        Total Amount
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-center`}
                                    >
                                        Status
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                    >
                                        Registered At
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
                                            colSpan={11}
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
                                                className={`${elevatedIndexTableStyles.firstCell} min-w-[16rem]`}
                                            >
                                                <div
                                                    className={`${elevatedIndexTableStyles.primaryText} whitespace-nowrap`}
                                                    title={
                                                        registration.event.name
                                                    }
                                                >
                                                    {registration.event.name}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[14rem]`}
                                            >
                                                <div
                                                    className={`${elevatedIndexTableStyles.primaryText} whitespace-nowrap`}
                                                    title={
                                                        registration.pastor
                                                            .church_name
                                                    }
                                                >
                                                    {
                                                        registration.pastor
                                                            .church_name
                                                    }
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[14rem]`}
                                            >
                                                <div
                                                    className={`${elevatedIndexTableStyles.primaryText} whitespace-nowrap`}
                                                    title={
                                                        registration.pastor
                                                            .pastor_name
                                                    }
                                                >
                                                    {
                                                        registration.pastor
                                                            .pastor_name
                                                    }
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[14rem]`}
                                            >
                                                <div
                                                    className={`${elevatedIndexTableStyles.primaryText} whitespace-nowrap`}
                                                    title={
                                                        registration.submitted_by_name ??
                                                        'Submitted online'
                                                    }
                                                >
                                                    {registration.submitted_by_name ??
                                                        'Submitted online'}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[12rem]`}
                                            >
                                                <div
                                                    className={`${elevatedIndexTableStyles.primaryText} whitespace-nowrap`}
                                                    title={
                                                        registration
                                                            .event_bank_account
                                                            ?.bank_name ?? '-'
                                                    }
                                                >
                                                    {registration
                                                        .event_bank_account
                                                        ?.bank_name ?? '-'}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[12rem]`}
                                            >
                                                {registration.receipt.url ? (
                                                    <a
                                                        href={
                                                            registration.receipt
                                                                .url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 font-mono font-semibold whitespace-nowrap text-[#184d47] underline-offset-4 hover:underline dark:text-emerald-300"
                                                    >
                                                        <ReceiptText className="size-4 shrink-0" />
                                                        {registration.payment_reference
                                                            ? `Ref. ${registration.payment_reference}`
                                                            : 'View receipt'}
                                                    </a>
                                                ) : (
                                                    <span className="whitespace-nowrap text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[8rem] text-right whitespace-nowrap text-foreground`}
                                            >
                                                {registration.total_quantity}
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[10rem] text-right whitespace-nowrap text-foreground`}
                                            >
                                                {formatCurrency(
                                                    registration.total_amount,
                                                )}
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[12rem] text-center`}
                                            >
                                                <DataTableBadge
                                                    tone={resolveDataTableTone(
                                                        registration.registration_status,
                                                        {
                                                            'pending verification':
                                                                'amber',
                                                            'needs correction':
                                                                'amber',
                                                            verified: 'emerald',
                                                            completed:
                                                                'emerald',
                                                            rejected: 'rose',
                                                            cancelled: 'rose',
                                                        },
                                                        'slate',
                                                    )}
                                                    className="mx-auto"
                                                >
                                                    {
                                                        registration.registration_status
                                                    }
                                                </DataTableBadge>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[12rem] text-right whitespace-nowrap text-muted-foreground`}
                                            >
                                                {formatDate(
                                                    registration.submitted_at,
                                                )}
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
                    eventBankAccount={selectedRegistration?.event_bank_account}
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
