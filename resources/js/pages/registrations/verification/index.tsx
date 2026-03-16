import { Head, router, usePage } from '@inertiajs/react';
import { BadgeCheck, CircleX, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import RegistrationVerificationController from '@/actions/App/Http/Controllers/RegistrationVerificationController';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import DataTablePagination from '@/components/data-table-pagination';
import DataTableToolbar from '@/components/data-table-toolbar';
import { reviewWorkspaceStyles } from '@/components/data-table-presets';
import Heading from '@/components/heading';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatSystemDateTime } from '@/lib/date-time';
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
    submitted_by: {
        id: number;
        name: string;
        email: string;
    } | null;
    payment_reference: string | null;
    registration_status: string;
    total_quantity: number;
    total_amount: string;
    remarks: string | null;
    submitted_at: string | null;
    verified_at: string | null;
    verified_by: {
        id: number;
        name: string;
    } | null;
    receipt: {
        original_name: string | null;
        uploaded_at: string | null;
        url: string;
    };
    items: RegistrationItemRecord[];
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    scopeSummary: string;
    summary: {
        pending_verification: number;
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

const formatDate = (value: string | null): string => {
    if (! value) {
        return 'Not submitted';
    }

    return formatSystemDateTime(value);
};

export default function RegistrationVerificationIndex({
    scopeSummary,
    summary,
    registrations,
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
        router.get(RegistrationVerificationController.index.url({ query }), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const reviewRegistration = (
        registration: RegistrationRecord,
        decision: 'verified' | 'rejected',
    ): void => {
        const confirmationMessage =
            decision === 'verified'
                ? `Verify registration #${registration.id}?`
                : `Reject registration #${registration.id}?`;

        if (! window.confirm(confirmationMessage)) {
            return;
        }

        router.patch(
            RegistrationVerificationController.update.url(registration.id),
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
            title: 'Pending Review',
            value: summary.pending_verification,
            subtitle: 'Awaiting receipt review',
            icon: Clock3,
            cardClassName: reviewWorkspaceStyles.summaryCardPending,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconPending,
        },
        {
            title: 'Verified',
            value: summary.verified,
            subtitle: 'Approved registrations',
            icon: BadgeCheck,
            cardClassName: reviewWorkspaceStyles.summaryCardApproved,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconApproved,
        },
        {
            title: 'Rejected',
            value: summary.rejected,
            subtitle: 'Needs resubmission',
            icon: CircleX,
            cardClassName: reviewWorkspaceStyles.summaryCardRejected,
            iconWrapperClassName: reviewWorkspaceStyles.summaryIconRejected,
        },
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Registration Verification" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Registration verification"
                    description={`Review uploaded receipts and update online registration statuses within ${scopeSummary}.`}
                />

                <div className="grid gap-4 xl:grid-cols-3">
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

                {flash?.success && (
                    <div className={reviewWorkspaceStyles.flashSuccess}>
                        {flash.success}
                    </div>
                )}

                {errorMessage && (
                    <div className={reviewWorkspaceStyles.flashError}>
                        {errorMessage}
                    </div>
                )}

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
                            placeholder="Search by event, church, pastor, reference, or receipt"
                            className={reviewWorkspaceStyles.toolbar}
                            searchWrapperClassName={reviewWorkspaceStyles.searchWrapper}
                            inputClassName={reviewWorkspaceStyles.input}
                            actionClassName={reviewWorkspaceStyles.action}
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
                                        <SelectTrigger className={reviewWorkspaceStyles.selectTrigger}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            align="end"
                                            className={reviewWorkspaceStyles.selectContent}
                                        >
                                            {statusOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className={reviewWorkspaceStyles.selectItem}
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
                        <table className="min-w-full divide-y divide-slate-200/80 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/50">
                                <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-400">
                                    <th className="py-3 pr-4 pl-6 font-medium text-slate-500 dark:text-slate-400">
                                        Transaction
                                    </th>
                                    <th className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">
                                        Church
                                    </th>
                                    <th className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">
                                        Event
                                    </th>
                                    <th className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">
                                        Items
                                    </th>
                                    <th className="py-3 pr-4 font-medium text-slate-500 dark:text-slate-400">
                                        Receipt
                                    </th>
                                    <th className="py-3 pr-6 font-medium text-slate-500 dark:text-slate-400">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                                {registrations.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-16 text-center"
                                        >
                                            <div className="space-y-2">
                                                <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                                    {filters.search === ''
                                                        ? 'No registrations matched the current verification filter.'
                                                        : `No registrations matched "${filters.search}".`}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                                    Adjust the search term or switch the status filter to review other submissions.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    registrations.data.map((registration) => (
                                        <tr
                                            key={registration.id}
                                            className="bg-background transition-colors odd:bg-white even:bg-slate-50/70 hover:bg-[#f3f8f6] dark:bg-slate-950 dark:odd:bg-slate-950 dark:even:bg-slate-900/50 dark:hover:bg-slate-900"
                                        >
                                            <td className="px-6 py-4 align-middle">
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    #{registration.id}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    Submitted {formatDate(registration.submitted_at)}
                                                </div>
                                                {registration.submitted_by && (
                                                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                        {registration.submitted_by.name}
                                                    </div>
                                                )}
                                                {registration.payment_reference && (
                                                    <div
                                                        className={reviewWorkspaceStyles.referenceTag}
                                                    >
                                                        Ref. {registration.payment_reference}
                                                    </div>
                                                )}
                                                {registration.remarks && (
                                                    <div className="mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                        {registration.remarks}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 pr-4 align-middle">
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {registration.pastor.church_name}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {registration.pastor.pastor_name}
                                                </div>
                                                <div className="mt-3 text-xs font-semibold tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400">
                                                    {registration.pastor.district_name}
                                                </div>
                                                <div className="mt-1 text-xs font-semibold tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400">
                                                    {registration.pastor.section_name}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-middle">
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {registration.event.name}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {registration.event.venue}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-middle">
                                                <div className="space-y-2">
                                                    {registration.items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="text-sm text-slate-500 dark:text-slate-400"
                                                        >
                                                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                                                {item.category_name}
                                                            </span>{' '}
                                                            × {item.quantity}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 font-medium text-slate-900 dark:text-slate-100">
                                                    {formatCurrency(
                                                        registration.total_amount,
                                                    )}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {registration.total_quantity}{' '}
                                                    delegates
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-middle">
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {registration.receipt.original_name ??
                                                        'No receipt uploaded'}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {formatDate(
                                                        registration.receipt.uploaded_at,
                                                    )}
                                                </div>
                                                <div className="mt-3">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className={reviewWorkspaceStyles.surfaceButton}
                                                    >
                                                        <a
                                                            href={
                                                                registration.receipt.url
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            View receipt
                                                        </a>
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="py-4 pr-6 align-middle">
                                                <div className="flex flex-col gap-3">
                                                    <DataTableBadge
                                                        tone={resolveDataTableTone(
                                                            registration.registration_status,
                                                            {
                                                                verified:
                                                                    'emerald',
                                                                rejected:
                                                                    'rose',
                                                                'pending verification':
                                                                    'amber',
                                                            },
                                                        )}
                                                        className="w-fit rounded-md capitalize"
                                                    >
                                                        {
                                                            registration.registration_status
                                                        }
                                                    </DataTableBadge>

                                                    {registration.verified_by &&
                                                        registration.verified_at && (
                                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                                {registration.verified_by.name}
                                                                <div className="mt-1">
                                                                    {formatDate(
                                                                        registration.verified_at,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className={reviewWorkspaceStyles.primaryButton}
                                                            disabled={
                                                                registration.registration_status ===
                                                                'verified'
                                                            }
                                                            onClick={() =>
                                                                reviewRegistration(
                                                                    registration,
                                                                    'verified',
                                                                )
                                                            }
                                                        >
                                                            Verify
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className={reviewWorkspaceStyles.dangerButton}
                                                            disabled={
                                                                registration.registration_status ===
                                                                'rejected'
                                                            }
                                                            onClick={() =>
                                                                reviewRegistration(
                                                                    registration,
                                                                    'rejected',
                                                                )
                                                            }
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </div>
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
