import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertTriangle,
    BadgeCheck,
    CalendarDays,
    CircleX,
    Clock3,
    Eye,
    FileSearch,
    PencilLine,
} from 'lucide-react';
import { useState } from 'react';
import RegistrationAlterationController from '@/actions/App/Http/Controllers/RegistrationAlterationController';
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
import SummaryStatCards from '@/components/summary-stat-cards';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatSystemDateTime } from '@/lib/date-time';
import { createClearFormErrorHandlers } from '@/lib/form-errors';
import { formTextareaClassName } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, PaginatedData } from '@/types';
import type { Auth } from '@/types/auth';

type StatusOption = {
    value: string;
    label: string;
};

type SectionOption = {
    id: number;
    name: string;
    district_name: string | null;
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
    event_bank_account: {
        id: number;
        bank_name: string;
        account_name: string;
        account_number: string;
        qr_code_url: string | null;
        status: string;
    } | null;
    registration_status: string;
    can_review: boolean;
    can_alter: boolean;
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
        section_id: number | null;
        search: string;
        status: string;
        submitted_date_from: string;
        submitted_date_to: string;
        per_page: number;
    };
    sections: SectionOption[];
    statusOptions: StatusOption[];
    perPageOptions: number[];
};

type ReviewDecision = 'verified' | 'needs correction' | 'rejected';

type ReviewFormData = {
    decision: ReviewDecision;
    review_reason: string;
    review_notes: string;
};

type VerificationIndexQuery = {
    section_id?: number;
    search?: string;
    status: string;
    submitted_date_from?: string;
    submitted_date_to?: string;
    per_page: number;
    page?: number;
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

const verificationTableClassName = `${elevatedIndexTableStyles.table} min-w-[88rem]`;

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

const formatDateTime = (
    value: string | null,
    fallback = 'Not available',
): string => (value ? formatSystemDateTime(value) : fallback);

const parseDateValue = (value: string): Date | undefined => {
    if (value === '') {
        return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
};

const toDateValue = (value: Date | undefined): string => {
    if (!value) {
        return '';
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

type VerificationDatePickerProps = {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
};

function VerificationDatePicker({
    id,
    label,
    value,
    placeholder,
    onChange,
}: VerificationDatePickerProps) {
    const [open, setOpen] = useState(false);
    const selectedDate = parseDateValue(value);

    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
                <Label htmlFor={id}>{label}</Label>
                {value !== '' && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange('')}
                        className="h-auto px-0 text-[12px] text-slate-500 hover:bg-transparent hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        Clear
                    </Button>
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        className={cn(
                            elevatedIndexTableStyles.selectTrigger,
                            'w-full justify-between bg-white text-left font-normal shadow-none hover:bg-white dark:bg-slate-950 dark:hover:bg-slate-950',
                            selectedDate === undefined &&
                                'text-slate-400 dark:text-slate-500',
                        )}
                    >
                        <span>
                            {selectedDate
                                ? format(selectedDate, 'MMMM d, yyyy')
                                : placeholder}
                        </span>
                        <CalendarDays className="size-4 text-slate-500 dark:text-slate-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className="w-auto rounded-md border-slate-200 p-0 dark:border-slate-800 dark:bg-slate-950"
                >
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            onChange(toDateValue(date));

                            if (date !== undefined) {
                                setOpen(false);
                            }
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

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
    sections,
    statusOptions,
    perPageOptions,
}: Props) {
    const { auth } = usePage<{
        auth: Auth;
    }>().props;
    const isSuperAdminViewer = auth.can.viewSystemAdminMenu;
    const [search, setSearch] = useState(filters.search);
    const [sectionId, setSectionId] = useState(
        filters.section_id !== null ? String(filters.section_id) : 'all',
    );
    const [status, setStatus] = useState(filters.status);
    const [submittedDateFrom, setSubmittedDateFrom] = useState(
        filters.submitted_date_from,
    );
    const [submittedDateTo, setSubmittedDateTo] = useState(
        filters.submitted_date_to,
    );
    const [selectedRegistration, setSelectedRegistration] =
        useState<RegistrationRecord | null>(null);
    const form = useForm<ReviewFormData>({
        decision: 'verified',
        review_reason: '',
        review_notes: '',
    });

    const activeDecision = form.data.decision;
    const activeDecisionContent = decisionContent[activeDecision];
    const reviewFormErrorHandlers = createClearFormErrorHandlers(
        form.clearErrors,
    );
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

    const buildQuery = ({
        searchValue,
        sectionValue,
        statusValue,
        submittedDateFromValue,
        submittedDateToValue,
        perPage,
        page,
    }: {
        searchValue: string;
        sectionValue: string;
        statusValue: string;
        submittedDateFromValue: string;
        submittedDateToValue: string;
        perPage: number;
        page?: number;
    }): VerificationIndexQuery => {
        const normalizedSearch = searchValue.trim();

        return {
            ...(sectionValue !== 'all'
                ? { section_id: Number(sectionValue) }
                : {}),
            ...(normalizedSearch !== '' ? { search: normalizedSearch } : {}),
            status: statusValue,
            ...(submittedDateFromValue !== ''
                ? { submitted_date_from: submittedDateFromValue }
                : {}),
            ...(submittedDateToValue !== ''
                ? { submitted_date_to: submittedDateToValue }
                : {}),
            per_page: perPage,
            ...(page !== undefined && page > 1 ? { page } : {}),
        };
    };

    const activeIndexQuery = buildQuery({
        searchValue: filters.search,
        sectionValue:
            filters.section_id !== null ? String(filters.section_id) : 'all',
        statusValue: filters.status,
        submittedDateFromValue: filters.submitted_date_from,
        submittedDateToValue: filters.submitted_date_to,
        perPage: filters.per_page,
        page:
            registrations.meta.current_page > 1
                ? registrations.meta.current_page
                : undefined,
    });

    const visitIndex = (query: VerificationIndexQuery): void => {
        router.get(
            RegistrationVerificationController.index.url({ query }),
            {},
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            },
        );
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

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-5">
                <Heading
                    title="Registration verification"
                    description={`Review uploaded receipts and resolve registrations within ${scopeSummary}.`}
                />

                <SummaryStatCards
                    gridClassName="grid gap-3 xl:grid-cols-4"
                    items={summaryCards}
                />

                {isSuperAdminViewer && (
                    <div className="flex justify-end">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                visitIndex(
                                    buildQuery({
                                        searchValue: search,
                                        sectionValue: sectionId,
                                        statusValue: status,
                                        submittedDateFromValue:
                                            submittedDateFrom,
                                        submittedDateToValue: submittedDateTo,
                                        perPage: filters.per_page,
                                    }),
                                );
                            }}
                            className="grid w-full gap-4 md:max-w-[44rem] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
                        >
                            <VerificationDatePicker
                                id="verification-submitted-date-from"
                                label="Submitted from"
                                value={submittedDateFrom}
                                placeholder="Select a start date"
                                onChange={setSubmittedDateFrom}
                            />

                            <VerificationDatePicker
                                id="verification-submitted-date-to"
                                label="Submitted to"
                                value={submittedDateTo}
                                placeholder="Select an end date"
                                onChange={setSubmittedDateTo}
                            />

                            <Button
                                type="submit"
                                className="h-11 rounded-md px-5 md:self-end"
                            >
                                Apply dates
                            </Button>
                        </form>
                    </div>
                )}

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
                                        submittedDateFromValue:
                                            submittedDateFrom,
                                        submittedDateToValue: submittedDateTo,
                                        perPage: filters.per_page,
                                    }),
                                )
                            }
                            placeholder="Search event, church, pastor, reference, or submitter"
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
                                                        submittedDateFromValue:
                                                            submittedDateFrom,
                                                        submittedDateToValue:
                                                            submittedDateTo,
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
                                        onValueChange={(nextStatus) => {
                                            setStatus(nextStatus);
                                            visitIndex(
                                                buildQuery({
                                                    searchValue: search,
                                                    sectionValue: sectionId,
                                                    statusValue: nextStatus,
                                                    submittedDateFromValue:
                                                        submittedDateFrom,
                                                    submittedDateToValue:
                                                        submittedDateTo,
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
                        <table className={verificationTableClassName}>
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
                                        Registration
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Submitted by
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
                                        Items
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Totals
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
                                        Review
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
                                                        ? 'No registrations matched the current queue filter.'
                                                        : `No registrations matched "${filters.search}".`}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    Adjust the search term or
                                                    switch the queue filter to
                                                    review another set of
                                                    registrations.
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
                                                    className={
                                                        elevatedIndexTableStyles.primaryText
                                                    }
                                                >
                                                    {registration.event.name}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.secondaryText
                                                    }
                                                >
                                                    {formatDateTime(
                                                        registration.submitted_at,
                                                        'Not submitted',
                                                    )}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[13rem]`}
                                            >
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.primaryText
                                                    }
                                                >
                                                    {registration.submitted_by
                                                        ?.name ??
                                                        'Not available'}
                                                </div>
                                                <div
                                                    className={`${elevatedIndexTableStyles.secondaryText} whitespace-nowrap`}
                                                >
                                                    {registration.submitted_by
                                                        ?.email ??
                                                        'No email on record'}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[14rem]`}
                                            >
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
                                                    className={`${elevatedIndexTableStyles.secondaryText} whitespace-nowrap`}
                                                >
                                                    {
                                                        registration.pastor
                                                            .pastor_name
                                                    }
                                                    {' - '}
                                                    {
                                                        registration.pastor
                                                            .section_name
                                                    }
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[18rem]`}
                                            >
                                                <div className="space-y-1.5">
                                                    {registration.items.map(
                                                        (item) => (
                                                            <div
                                                                key={item.id}
                                                                className="space-y-0.5"
                                                            >
                                                                <div className="text-[12px] font-medium whitespace-nowrap text-foreground sm:text-[13px]">
                                                                    {
                                                                        item.category_name
                                                                    }{' '}
                                                                    -{' '}
                                                                    <span className="text-muted-foreground">
                                                                        {
                                                                            item.quantity
                                                                        }{' '}
                                                                        x{' '}
                                                                        {formatCurrency(
                                                                            item.unit_amount,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[10rem] text-[12px] text-muted-foreground sm:text-[13px]`}
                                            >
                                                <div className="font-medium whitespace-nowrap text-foreground">
                                                    {
                                                        registration.total_quantity
                                                    }{' '}
                                                    delegates
                                                </div>
                                                <div className="mt-1 font-medium text-foreground">
                                                    {formatCurrency(
                                                        registration.total_amount,
                                                    )}
                                                </div>
                                                {registration.remarks && (
                                                    <div className="mt-1 line-clamp-1 max-w-sm">
                                                        {registration.remarks}
                                                    </div>
                                                )}
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
                                                                    .receipt.url
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
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[12rem]`}
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
                                                            rejected: 'rose',
                                                        },
                                                        'slate',
                                                    )}
                                                >
                                                    {
                                                        registration.registration_status
                                                    }
                                                </DataTableBadge>
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
                                                        openRegistrationDialog(
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

                    <div className={reviewWorkspaceStyles.paginationWrapper}>
                        <DataTablePagination
                            meta={registrations.meta}
                            rowsPerPage={filters.per_page}
                            rowOptions={perPageOptions}
                            onRowsPerPageChange={(value) =>
                                visitIndex(
                                    buildQuery({
                                        searchValue: filters.search,
                                        sectionValue:
                                            filters.section_id !== null
                                                ? String(filters.section_id)
                                                : 'all',
                                        statusValue: filters.status,
                                        submittedDateFromValue:
                                            filters.submitted_date_from,
                                        submittedDateToValue:
                                            filters.submitted_date_to,
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
                                        submittedDateFromValue:
                                            filters.submitted_date_from,
                                        submittedDateToValue:
                                            filters.submitted_date_to,
                                        perPage: filters.per_page,
                                        page: pageNumber,
                                    }),
                                )
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
                            ellipsisClassName={reviewWorkspaceStyles.ellipsis}
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
                                  email: selectedRegistration.submitted_by
                                      .email,
                              }
                            : null
                    }
                    verifiedAt={selectedRegistration?.verified_at}
                    verifiedBy={selectedRegistration?.verified_by}
                    paymentReference={selectedRegistration?.payment_reference}
                    eventBankAccount={selectedRegistration?.event_bank_account}
                    remarks={selectedRegistration?.remarks}
                    receipt={selectedRegistration?.receipt}
                    items={selectedRegistration?.items ?? []}
                    reviews={selectedRegistration?.review_history ?? []}
                    children={
                        selectedRegistration?.can_review ? (
                            <div
                                className="space-y-5"
                                {...reviewFormErrorHandlers}
                            >
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
                                            form.setData('decision', 'verified')
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
                                            form.setData('decision', 'rejected')
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
                            {selectedRegistration?.can_alter && (
                                <Button type="button" variant="outline" asChild>
                                    <Link
                                        href={RegistrationAlterationController.edit.url(
                                            selectedRegistration.id,
                                            {
                                                query: activeIndexQuery,
                                            },
                                        )}
                                    >
                                        <PencilLine className="size-4" />
                                        Alter registration
                                    </Link>
                                </Button>
                            )}
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
