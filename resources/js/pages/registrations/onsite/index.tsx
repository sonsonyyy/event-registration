import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    event: {
        id: number;
        name: string;
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
    encoded_by: {
        id: number;
        name: string;
    };
    items: RegistrationItemRecord[];
};

type SectionOption = {
    id: number;
    name: string;
    district_name: string | null;
};

type Props = {
    registrations: PaginatedData<RegistrationRecord>;
    filters: {
        section_id: number | null;
        search: string;
        per_page: number;
    };
    sections: SectionOption[];
    perPageOptions: number[];
};

type OnsiteIndexQuery = {
    section_id?: number;
    search?: string;
    per_page: number;
    page?: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Onsite Registration',
        href: OnsiteRegistrationController.index(),
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

export default function OnsiteRegistrationIndex({
    registrations,
    filters,
    sections,
    perPageOptions,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [sectionId, setSectionId] = useState(
        filters.section_id !== null ? String(filters.section_id) : 'all',
    );
    const [selectedRegistration, setSelectedRegistration] =
        useState<RegistrationRecord | null>(null);

    const buildQuery = ({
        searchValue,
        sectionValue,
        perPage,
        page,
    }: {
        searchValue: string;
        sectionValue: string;
        perPage: number;
        page?: number;
    }): OnsiteIndexQuery => {
        const normalizedSearch = searchValue.trim();

        return {
            ...(sectionValue !== 'all'
                ? { section_id: Number(sectionValue) }
                : {}),
            ...(normalizedSearch !== '' ? { search: normalizedSearch } : {}),
            per_page: perPage,
            ...(page !== undefined && page > 1 ? { page } : {}),
        };
    };

    const visitIndex = (query: OnsiteIndexQuery): void => {
        router.get(
            OnsiteRegistrationController.index.url({ query }),
            {},
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            },
        );
    };

    const submitSearch = (): void => {
        visitIndex(
            buildQuery({
                searchValue: search,
                sectionValue: sectionId,
                perPage: filters.per_page,
            }),
        );
    };

    const updatePerPage = (value: number): void => {
        visitIndex(
            buildQuery({
                searchValue: filters.search,
                sectionValue:
                    filters.section_id !== null
                        ? String(filters.section_id)
                        : 'all',
                perPage: value,
            }),
        );
    };

    const changePage = (pageNumber: number): void => {
        visitIndex(
            buildQuery({
                searchValue: filters.search,
                sectionValue:
                    filters.section_id !== null
                        ? String(filters.section_id)
                        : 'all',
                perPage: filters.per_page,
                page: pageNumber,
            }),
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Onsite Registration" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-5">
                <Heading
                    title="Onsite registration"
                    description="Record walk-in quantities with multiple fee-category items in a single transaction."
                    className="mb-3"
                />

                <div className={elevatedIndexTableStyles.shell}>
                    <div className={elevatedIndexTableStyles.band}>
                        <DataTableToolbar
                            searchValue={search}
                            onSearchValueChange={setSearch}
                            onSubmit={submitSearch}
                            placeholder="Search event, church, pastor, receipt, or encoder"
                            className={elevatedIndexTableStyles.toolbar}
                            searchWrapperClassName={
                                elevatedIndexTableStyles.searchWrapper
                            }
                            inputClassName={elevatedIndexTableStyles.input}
                            actionClassName={elevatedIndexTableStyles.action}
                            action={
                                <div
                                    className={
                                        elevatedIndexTableStyles.headerActions
                                    }
                                >
                                    {sections.length > 0 && (
                                        <Select
                                            value={sectionId}
                                            onValueChange={(value) => {
                                                setSectionId(value);
                                                visitIndex(
                                                    buildQuery({
                                                        searchValue: search,
                                                        sectionValue: value,
                                                        perPage:
                                                            filters.per_page,
                                                    }),
                                                );
                                            }}
                                        >
                                            <SelectTrigger
                                                className={
                                                    elevatedIndexTableStyles.selectTrigger
                                                }
                                            >
                                                <SelectValue placeholder="All sections" />
                                            </SelectTrigger>
                                            <SelectContent
                                                align="end"
                                                className={
                                                    elevatedIndexTableStyles.selectContent
                                                }
                                            >
                                                <SelectItem
                                                    value="all"
                                                    className={
                                                        elevatedIndexTableStyles.selectItem
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
                                                            elevatedIndexTableStyles.selectItem
                                                        }
                                                    >
                                                        {section.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    <Button
                                        asChild
                                        className={
                                            elevatedIndexTableStyles.primaryButton
                                        }
                                    >
                                        <Link
                                            href={OnsiteRegistrationController.create()}
                                        >
                                            <Plus className="size-4" />
                                            New onsite transaction
                                        </Link>
                                    </Button>
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
                                        Transaction
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
                                        Payment
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Encoded by
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
                                            colSpan={7}
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
                                                        ? 'No onsite registrations yet.'
                                                        : `No registrations matched "${filters.search}".`}
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    {filters.search === ''
                                                        ? 'Create the first onsite transaction to start recording walk-in registrations.'
                                                        : 'Try another event, church, pastor, receipt, or encoder term.'}
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
                                                className={
                                                    elevatedIndexTableStyles.firstCell
                                                }
                                            >
                                                <div className="font-medium text-foreground">
                                                    {registration.event.name}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <span className="text-[12px] text-muted-foreground sm:text-[13px]">
                                                        {formatDate(
                                                            registration.submitted_at,
                                                        )}
                                                    </span>
                                                    <DataTableBadge
                                                        tone={resolveDataTableTone(
                                                            registration.registration_status,
                                                            {
                                                                completed:
                                                                    'emerald',
                                                                verified:
                                                                    'emerald',
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
                                                </div>
                                            </td>
                                            <td
                                                className={
                                                    elevatedIndexTableStyles.cell
                                                }
                                            >
                                                <div className="font-medium text-foreground">
                                                    {
                                                        registration.pastor
                                                            .church_name
                                                    }
                                                </div>
                                                <div className="mt-1 line-clamp-1 text-[12px] text-muted-foreground sm:text-[13px]">
                                                    {
                                                        registration.pastor
                                                            .pastor_name
                                                    }
                                                    {' • '}
                                                    {
                                                        registration.pastor
                                                            .section_name
                                                    }
                                                    {' • '}
                                                    {
                                                        registration.pastor
                                                            .district_name
                                                    }
                                                </div>
                                            </td>
                                            <td
                                                className={
                                                    elevatedIndexTableStyles.cell
                                                }
                                            >
                                                <div className="space-y-1.5">
                                                    {registration.items.map(
                                                        (item) => (
                                                            <div
                                                                key={item.id}
                                                                className="space-y-0.5"
                                                            >
                                                                <div className="font-medium text-foreground">
                                                                    {
                                                                        item.category_name
                                                                    }
                                                                </div>
                                                                <div className="text-[12px] text-muted-foreground sm:text-[13px]">
                                                                    {
                                                                        item.quantity
                                                                    }{' '}
                                                                    x{' '}
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
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-[12px] text-muted-foreground sm:text-[13px]`}
                                            >
                                                <div className="font-medium text-foreground">
                                                    {
                                                        registration.total_quantity
                                                    }{' '}
                                                    delegates •{' '}
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
                                                className={
                                                    elevatedIndexTableStyles.cell
                                                }
                                            >
                                                <DataTableBadge
                                                    tone={resolveDataTableTone(
                                                        registration.payment_status,
                                                        {
                                                            paid: 'emerald',
                                                            unpaid: 'rose',
                                                            partial: 'amber',
                                                        },
                                                    )}
                                                >
                                                    {
                                                        registration.payment_status
                                                    }
                                                </DataTableBadge>
                                                <div className="mt-1 line-clamp-1 text-[12px] text-muted-foreground sm:text-[13px]">
                                                    {registration.payment_reference ??
                                                        'No receipt reference'}
                                                </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-muted-foreground`}
                                            >
                                                <div>
                                                    {
                                                        registration.encoded_by
                                                            .name
                                                    }
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
                                                        setSelectedRegistration(
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

                    <div className={elevatedIndexTableStyles.paginationWrapper}>
                        <DataTablePagination
                            meta={registrations.meta}
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
                            setSelectedRegistration(null);
                        }
                    }}
                    title={
                        selectedRegistration
                            ? `Onsite registration #${selectedRegistration.id}`
                            : 'Onsite registration'
                    }
                    description="Review the full onsite transaction, grouped quantities, payment reference, and encoder details."
                    registrationStatus={
                        selectedRegistration?.registration_status ?? 'draft'
                    }
                    paymentStatus={selectedRegistration?.payment_status ?? null}
                    totalQuantity={selectedRegistration?.total_quantity ?? 0}
                    totalAmount={selectedRegistration?.total_amount ?? '0.00'}
                    event={
                        selectedRegistration?.event ?? {
                            id: 0,
                            name: '',
                        }
                    }
                    pastor={
                        selectedRegistration?.pastor ?? {
                            id: 0,
                            church_name: '',
                            pastor_name: '',
                            section_name: '',
                            district_name: '',
                        }
                    }
                    submittedAt={selectedRegistration?.submitted_at}
                    submittedBy={
                        selectedRegistration?.encoded_by
                            ? {
                                  name: selectedRegistration.encoded_by.name,
                              }
                            : null
                    }
                    paymentReference={selectedRegistration?.payment_reference}
                    remarks={selectedRegistration?.remarks}
                    items={selectedRegistration?.items ?? []}
                    footer={
                        selectedRegistration ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setSelectedRegistration(null)
                                    }
                                >
                                    Close
                                </Button>
                                {selectedRegistration.can_edit && (
                                    <Button asChild variant="outline">
                                        <Link
                                            href={OnsiteRegistrationController.edit(
                                                selectedRegistration.id,
                                            )}
                                        >
                                            Edit transaction
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : null
                    }
                />
            </div>
        </AppLayout>
    );
}
