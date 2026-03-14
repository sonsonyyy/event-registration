import { Head, router, usePage } from '@inertiajs/react';
import { BadgeCheck, CircleX, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import RegistrationVerificationController from '@/actions/App/Http/Controllers/RegistrationVerificationController';
import DataTablePagination from '@/components/data-table-pagination';
import DataTableToolbar from '@/components/data-table-toolbar';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
};

const registrationStatusClassName = (status: string): string => {
    switch (status) {
        case 'verified':
            return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300';
        case 'rejected':
            return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300';
        default:
            return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-300';
    }
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
            cardClassName:
                'border border-[#eadfca] border-t-4 border-t-[#c58b1e] bg-white shadow-[#c58b1e]/8 dark:border-amber-950/60 dark:border-t-amber-500 dark:bg-slate-950',
            iconWrapperClassName:
                'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
            eyebrowClassName: 'text-slate-500 dark:text-slate-400',
            valueClassName: 'text-slate-900 dark:text-slate-100',
            subtitleClassName: 'text-slate-600 dark:text-slate-400',
        },
        {
            title: 'Verified',
            value: summary.verified,
            subtitle: 'Approved registrations',
            icon: BadgeCheck,
            cardClassName:
                'border border-[#d6e2de] border-t-4 border-t-[#184d47] bg-white shadow-[#184d47]/8 dark:border-emerald-950/60 dark:border-t-emerald-500 dark:bg-slate-950',
            iconWrapperClassName:
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
            eyebrowClassName: 'text-slate-500 dark:text-slate-400',
            valueClassName: 'text-slate-900 dark:text-slate-100',
            subtitleClassName: 'text-slate-600 dark:text-slate-400',
        },
        {
            title: 'Rejected',
            value: summary.rejected,
            subtitle: 'Needs resubmission',
            icon: CircleX,
            cardClassName:
                'border border-[#ecd7d8] border-t-4 border-t-[#be4b56] bg-white shadow-[#be4b56]/8 dark:border-rose-950/60 dark:border-t-rose-500 dark:bg-slate-950',
            iconWrapperClassName:
                'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
            eyebrowClassName: 'text-slate-500 dark:text-slate-400',
            valueClassName: 'text-slate-900 dark:text-slate-100',
            subtitleClassName: 'text-slate-600 dark:text-slate-400',
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
                            className={`rounded-md px-5 py-5 shadow-sm ${card.cardClassName}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <div
                                        className={`text-xs font-semibold tracking-[0.22em] uppercase ${card.eyebrowClassName}`}
                                    >
                                        {card.title}
                                    </div>
                                    <div
                                        className={`text-3xl font-semibold tracking-[-0.04em] ${card.valueClassName}`}
                                    >
                                        {card.value}
                                    </div>
                                    <div
                                        className={`text-sm ${card.subtitleClassName}`}
                                    >
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

                <div className="overflow-hidden rounded-md border border-slate-200/80 bg-background shadow-[0_22px_60px_-34px_rgba(15,23,42,0.26)] dark:border-slate-800 dark:bg-slate-950">
                    <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#fcfdfb_0%,#f7f9f7_100%)] px-4 py-4 md:px-6 dark:border-slate-800 dark:bg-slate-950/70">
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
                            className="gap-3 lg:flex-row lg:items-end lg:justify-between"
                            searchWrapperClassName="max-w-none"
                            inputClassName="h-11 rounded-md border-slate-200 bg-white pl-12 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-[#184d47]/35 focus-visible:ring-[#184d47]/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                            actionClassName="w-full lg:w-auto"
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
                                                <div className="mt-2 inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-200">
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
                                            <div className="mt-3 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                                                {registration.pastor.district_name}
                                            </div>
                                            <div className="mt-1 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
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
                                                    className="rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
                                                <Badge
                                                    variant="outline"
                                                    className={`w-fit rounded-md px-2.5 py-1 capitalize ${registrationStatusClassName(
                                                        registration.registration_status,
                                                    )}`}
                                                >
                                                    {
                                                        registration.registration_status
                                                    }
                                                </Badge>

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
                                                        className="rounded-md bg-[#184d47] text-white hover:bg-[#143f3a] disabled:bg-[#184d47]/35 disabled:text-white"
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
                                                        variant="destructive"
                                                        className="rounded-md"
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

                    <div className="border-t border-slate-200/80 bg-slate-50/80 px-4 py-4 md:px-6 dark:border-slate-800 dark:bg-slate-950/70">
                        <DataTablePagination
                            meta={registrations.meta}
                            rowsPerPage={filters.per_page}
                            rowOptions={perPageOptions}
                            className="gap-4 border-none pt-0"
                            topRowClassName="gap-3 sm:items-center"
                            rowsTriggerClassName="h-11 w-[7.25rem] rounded-md border-slate-200 bg-white text-slate-700 shadow-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                            summaryClassName="text-sm font-medium text-slate-600 dark:text-slate-300"
                            navigationWrapperClassName="border-t border-slate-200 pt-4 dark:border-slate-800"
                            previousButtonClassName="h-9 rounded-md border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                            nextButtonClassName="h-9 rounded-md border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                            activePageButtonClassName="h-9 rounded-md border-[#184d47] bg-[#184d47] text-white hover:bg-[#143f3a]"
                            inactivePageButtonClassName="h-9 rounded-md border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                            ellipsisClassName="h-9 rounded-md text-slate-400 dark:text-slate-500"
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
