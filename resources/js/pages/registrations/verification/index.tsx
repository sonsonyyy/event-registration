import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeCheck,
    CircleX,
    Clock3,
    FileSearch,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import RegistrationVerificationController from '@/actions/App/Http/Controllers/RegistrationVerificationController';
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
import InputError from '@/components/input-error';
import RegistrationRecordDialog from '@/components/registration-record-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatSystemDateTime } from '@/lib/date-time';
import { formTextareaClassName } from '@/lib/ui-styles';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData } from '@/types';

type StatusOption = {
    value: string;
    label: string;
};

type ReviewRecord = {
    id: number;
    decision: string;
    reason: string | null;
    notes: string | null;
    decided_at: string | null;
    reviewer: {
        id: number;
        name: string;
    } | null;
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
    submitted_by: {
        id: number;
        name: string;
        email: string;
    } | null;
    payment_reference: string | null;
    registration_status: string;
    can_review: boolean;
    total_quantity: number;
    total_amount: string;
    remarks: string | null;
    submitted_at: string | null;
    verified_at: string | null;
    verified_by: {
        id: number;
        name: string;
    } | null;
    latest_review: ReviewRecord | null;
    review_history: ReviewRecord[];
    receipt: {
        original_name: string | null;
        uploaded_at: string | null;
        url: string;
    };
    items: Array<{
        id: number;
        category_name: string;
        quantity: number;
        unit_amount: string;
        subtotal_amount: string;
    }>;
};

type Props = {
    scopeSummary: string;
    summary: {
        pending_verification: number;
        needs_correction: number;
        verified: number;
        rejected: number;
    };
    registrations: PaginatedData<RegistrationRecord>;
    filters: {
        search: string;
        status: string;
        per_page: number;
    };
    statusOptions: StatusOption[];
    perPageOptions: number[];
};

type ReviewDecision = 'verified' | 'needs correction' | 'rejected';

type ReviewFormData = {
    decision: ReviewDecision;
    review_reason: string;
    review_notes: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Verification',
        href: RegistrationVerificationController.index(),
    },
];

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

const formatDateTime = (value: string | null, fallback = 'Not available'): string =>
    value ? formatSystemDateTime(value) : fallback;

const decisionContent: Record<
    ReviewDecision,
    {
        title: string;
        description: string;
        submitLabel: string;
    }
> = {
    verified: {
        title: 'Verify registration',
        description:
            'Confirm this payment and complete the online registration review.',
        submitLabel: 'Verify registration',
    },
    'needs correction': {
        title: 'Return for correction',
        description:
            'Send the registration back to the church representative with a clear correction note.',
        submitLabel: 'Return for correction',
    },
    rejected: {
        title: 'Reject registration',
        description:
            'Reject this registration and record the reason for the decision.',
        submitLabel: 'Reject registration',
    },
};

export default function RegistrationVerificationIndex({
    scopeSummary,
    summary,
    registrations,
    filters,
    statusOptions,
    perPageOptions,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [selectedRegistration, setSelectedRegistration] =
        useState<RegistrationRecord | null>(null);
    const form = useForm<ReviewFormData>({
        decision: 'verified',
        review_reason: '',
        review_notes: '',
    });

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    useEffect(() => {
        setStatus(filters.status);
    }, [filters.status]);

    const activeDecision = form.data.decision;
    const activeDecisionContent = decisionContent[activeDecision];
    const summaryCards = [
        {
            title: 'Pending Review',
            value: summary.pending_verification,
            subtitle: 'Ready for receipt checking',
            icon: Clock3,
            cardClassName: reviewWorkspaceStyles.summaryCardPending,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconPending,
        },
        {
            title: 'Needs Correction',
            value: summary.needs_correction,
            subtitle: 'Waiting for church updates',
            icon: AlertTriangle,
            cardClassName: reviewWorkspaceStyles.summaryCardPending,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconPending,
        },
        {
            title: 'Verified',
            value: summary.verified,
            subtitle: 'Completed verification',
            icon: BadgeCheck,
            cardClassName: reviewWorkspaceStyles.summaryCardApproved,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconApproved,
        },
        {
            title: 'Rejected',
            value: summary.rejected,
            subtitle: 'Closed without approval',
            icon: CircleX,
            cardClassName: reviewWorkspaceStyles.summaryCardRejected,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconRejected,
        },
    ] as const;

    const visitIndex = (query: {
        search?: string;
        status: string;
        per_page: number;
        page?: number;
    }): void => {
        router.get(RegistrationVerificationController.index.url({ query }), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const closeDialog = (): void => {
        setSelectedRegistration(null);
        form.reset();
        form.clearErrors();
    };

    const openRegistrationDialog = (registration: RegistrationRecord): void => {
        setSelectedRegistration(registration);
        form.setData({
            decision: 'verified',
            review_reason: '',
            review_notes: '',
        });
        form.clearErrors();
    };

    const submitReview = (): void => {
        if (selectedRegistration === null) {
            return;
        }

        form.patch(
            RegistrationVerificationController.update.url(
                selectedRegistration.id,
            ),
            {
                preserveScroll: true,
                onSuccess: () => closeDialog(),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Verification" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Registration verification"
                    description={`Review uploaded receipts and resolve registrations within ${scopeSummary}.`}
                />

                <div className="grid gap-4 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <div
                            key={card.title}
                            className={`${reviewWorkspaceStyles.summaryCard} ${card.cardClassName}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <div
                                        className={`text-xs font-semibold tracking-[0.22em] uppercase ${reviewWorkspaceStyles.summaryEyebrow}`}
                                    >
                                        {card.title}
                                    </div>
                                    <div
                                        className={`text-3xl font-semibold tracking-[-0.04em] ${reviewWorkspaceStyles.summaryValue}`}
                                    >
                                        {card.value}
                                    </div>
                                    <div
                                        className={`text-sm ${reviewWorkspaceStyles.summarySubtitle}`}
                                    >
                                        {card.subtitle}
                                    </div>
                                </div>

                                <div
                                    className={`${reviewWorkspaceStyles.summaryIconWrapper} ${card.iconWrapperClassName}`}
                                >
                                    <card.icon className="size-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={reviewWorkspaceStyles.shell}>
                    <div className={reviewWorkspaceStyles.band}>
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
                            placeholder="Search event, church, pastor, reference, or submitter"
                            className={reviewWorkspaceStyles.toolbar}
                            searchWrapperClassName={
                                reviewWorkspaceStyles.searchWrapper
                            }
                            inputClassName={reviewWorkspaceStyles.input}
                            actionClassName={reviewWorkspaceStyles.action}
                            action={
                                <div className="flex w-full sm:w-auto">
                                    <Select
                                        value={status}
                                        onValueChange={(nextStatus) => {
                                            setStatus(nextStatus);
                                            visitIndex({
                                                search:
                                                    search.trim() || undefined,
                                                status: nextStatus,
                                                per_page: filters.per_page,
                                                page: 1,
                                            });
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
                                <tr className={elevatedIndexTableStyles.headerRow}>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.firstHeaderCell
                                        }
                                    >
                                        Registration
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Church
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Items
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Receipt
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Status
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.lastHeaderCellRight
                                        }
                                    >
                                        Review
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
                                                        ? 'No registrations matched the current queue filter.'
                                                        : `No registrations matched "${filters.search}".`}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    Adjust the search term or switch the queue filter to review another set of registrations.
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
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.primaryText
                                                    }
                                                >
                                                    #{registration.id}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.secondaryText
                                                    }
                                                >
                                                    {registration.event.name}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.subMetaText
                                                    }
                                                >
                                                    {formatDateTime(
                                                        registration.submitted_at,
                                                        'Not submitted',
                                                    )}
                                                </div>
                                                {registration.submitted_by && (
                                                    <div
                                                        className={
                                                            elevatedIndexTableStyles.detailText
                                                        }
                                                    >
                                                        Submitted by{' '}
                                                        <span
                                                            className={
                                                                elevatedIndexTableStyles.strongText
                                                            }
                                                        >
                                                            {
                                                                registration
                                                                    .submitted_by
                                                                    .name
                                                            }
                                                        </span>
                                                        <span className="block text-xs leading-6 text-slate-500 dark:text-slate-400">
                                                            {
                                                                registration
                                                                    .submitted_by
                                                                    .email
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.primaryText
                                                    }
                                                >
                                                    {
                                                        registration.pastor
                                                            .church_name
                                                    }
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.secondaryText
                                                    }
                                                >
                                                    {
                                                        registration.pastor
                                                            .pastor_name
                                                    }
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.metaText
                                                    }
                                                >
                                                    {
                                                        registration.pastor
                                                            .section_name
                                                    }{' '}
                                                    •{' '}
                                                    {
                                                        registration.pastor
                                                            .district_name
                                                    }
                                                </div>
                                                {registration.remarks && (
                                                    <div
                                                        className={
                                                            elevatedIndexTableStyles.detailText
                                                        }
                                                    >
                                                        {registration.remarks}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div className="space-y-3">
                                                    {registration.items.map(
                                                        (item) => (
                                                            <div
                                                                key={item.id}
                                                                className={
                                                                    elevatedIndexTableStyles.subtleSurface
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        elevatedIndexTableStyles.primaryText
                                                                    }
                                                                >
                                                                    {
                                                                        item.category_name
                                                                    }
                                                                </div>
                                                                <div
                                                                    className={
                                                                        elevatedIndexTableStyles.secondaryText
                                                                    }
                                                                >
                                                                    {
                                                                        item.quantity
                                                                    }{' '}
                                                                    ×{' '}
                                                                    {formatCurrency(
                                                                        item.unit_amount,
                                                                    )}{' '}
                                                                    ={' '}
                                                                    {formatCurrency(
                                                                        item.subtotal_amount,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                    <div
                                                        className={
                                                            elevatedIndexTableStyles.metaText
                                                        }
                                                    >
                                                        {
                                                            registration.total_quantity
                                                        }{' '}
                                                        delegates •{' '}
                                                        {formatCurrency(
                                                            registration.total_amount,
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.primaryText
                                                    }
                                                >
                                                    {registration.receipt
                                                        .original_name ??
                                                        'No receipt uploaded'}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.secondaryText
                                                    }
                                                >
                                                    {formatDateTime(
                                                        registration.receipt
                                                            .uploaded_at,
                                                        'Not uploaded',
                                                    )}
                                                </div>
                                                {registration.payment_reference && (
                                                    <div
                                                        className={
                                                            reviewWorkspaceStyles.referenceTag
                                                        }
                                                    >
                                                        Ref.{' '}
                                                        {
                                                            registration.payment_reference
                                                        }
                                                    </div>
                                                )}
                                                <div className="mt-3">
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
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div className="space-y-3">
                                                    <DataTableBadge
                                                        tone={resolveDataTableTone(
                                                            registration.registration_status,
                                                            {
                                                                'pending verification':
                                                                    'amber',
                                                                'needs correction':
                                                                    'amber',
                                                                verified:
                                                                    'emerald',
                                                                rejected:
                                                                    'rose',
                                                            },
                                                            'slate',
                                                        )}
                                                    >
                                                        {
                                                            registration.registration_status
                                                        }
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
                                                        openRegistrationDialog(
                                                            registration,
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
                            meta={registrations.meta}
                            rowsPerPage={filters.per_page}
                            rowOptions={perPageOptions}
                            onRowsPerPageChange={(value) =>
                                visitIndex({
                                    search: filters.search || undefined,
                                    status,
                                    per_page: value,
                                    page: 1,
                                })
                            }
                            onPageChange={(pageNumber) =>
                                visitIndex({
                                    search: filters.search || undefined,
                                    status,
                                    per_page: filters.per_page,
                                    ...(pageNumber > 1
                                        ? { page: pageNumber }
                                        : {}),
                                })
                            }
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
                            ellipsisClassName={
                                reviewWorkspaceStyles.ellipsis
                            }
                        />
                    </div>
                </div>

                <RegistrationRecordDialog
                    open={selectedRegistration !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDialog();
                        }
                    }}
                    title={
                        selectedRegistration
                            ? `Verification review #${selectedRegistration.id}`
                            : 'Verification review'
                    }
                    description="Open the full registration record, inspect the uploaded receipt, and complete the review from one place."
                    registrationStatus={
                        selectedRegistration?.registration_status ?? 'draft'
                    }
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
                    submittedBy={
                        selectedRegistration?.submitted_by
                            ? {
                                  name: selectedRegistration.submitted_by.name,
                                  email: selectedRegistration.submitted_by.email,
                              }
                            : null
                    }
                    verifiedAt={selectedRegistration?.verified_at}
                    verifiedBy={selectedRegistration?.verified_by}
                    paymentReference={selectedRegistration?.payment_reference}
                    remarks={selectedRegistration?.remarks}
                    receipt={selectedRegistration?.receipt}
                    items={selectedRegistration?.items ?? []}
                    reviews={selectedRegistration?.review_history ?? []}
                    children={
                        selectedRegistration?.can_review ? (
                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                                        Review action
                                    </div>
                                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {activeDecisionContent.title}
                                    </div>
                                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        {activeDecisionContent.description}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            activeDecision === 'verified'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            form.setData(
                                                'decision',
                                                'verified',
                                            )
                                        }
                                        className={
                                            activeDecision === 'verified'
                                                ? reviewWorkspaceStyles.primaryButton
                                                : reviewWorkspaceStyles.surfaceButton
                                        }
                                    >
                                        Verify
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            activeDecision ===
                                            'needs correction'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            form.setData(
                                                'decision',
                                                'needs correction',
                                            )
                                        }
                                        className={
                                            activeDecision ===
                                            'needs correction'
                                                ? reviewWorkspaceStyles.primaryButton
                                                : reviewWorkspaceStyles.surfaceButton
                                        }
                                    >
                                        Needs correction
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            activeDecision === 'rejected'
                                                ? 'destructive'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            form.setData(
                                                'decision',
                                                'rejected',
                                            )
                                        }
                                        className={
                                            activeDecision === 'rejected'
                                                ? undefined
                                                : reviewWorkspaceStyles.dangerButton
                                        }
                                    >
                                        Reject
                                    </Button>
                                </div>

                                {(activeDecision === 'needs correction' ||
                                    activeDecision === 'rejected') && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="review_reason">
                                            Review reason
                                        </Label>
                                        <textarea
                                            id="review_reason"
                                            name="review_reason"
                                            value={form.data.review_reason}
                                            onChange={(event) =>
                                                form.setData(
                                                    'review_reason',
                                                    event.target.value,
                                                )
                                            }
                                            className={formTextareaClassName}
                                            placeholder="Explain what the reviewer found and what the church should do next."
                                        />
                                        <InputError
                                            message={form.errors.review_reason}
                                        />
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="review_notes">
                                        Reviewer notes
                                    </Label>
                                    <textarea
                                        id="review_notes"
                                        name="review_notes"
                                        value={form.data.review_notes}
                                        onChange={(event) =>
                                            form.setData(
                                                'review_notes',
                                                event.target.value,
                                            )
                                        }
                                        className={formTextareaClassName}
                                        placeholder="Optional internal notes for follow-up or audit purposes."
                                    />
                                    <InputError
                                        message={form.errors.review_notes}
                                    />
                                </div>
                            </div>
                        ) : null
                    }
                    footer={
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeDialog}
                            >
                                Close
                            </Button>
                            {selectedRegistration?.can_review && (
                                <Button
                                    type="button"
                                    onClick={submitReview}
                                    disabled={form.processing}
                                    variant={
                                        activeDecision === 'rejected'
                                            ? 'destructive'
                                            : 'default'
                                    }
                                >
                                    {activeDecisionContent.submitLabel}
                                </Button>
                            )}
                        </div>
                    }
                />
            </div>
        </AppLayout>
    );
}
