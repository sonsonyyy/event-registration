import { Head, Link, router } from '@inertiajs/react';
import { Archive, PencilLine, Plus } from 'lucide-react';
import { useState } from 'react';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type District = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    sections_count: number;
};

type Props = {
    districts: District[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Districts',
        href: DistrictController.index(),
    },
];

const districtTableClassName = `${elevatedIndexTableStyles.table} min-w-[60rem]`;

export default function DistrictIndex({ districts }: Props) {
    const [districtToDelete, setDistrictToDelete] = useState<District | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const destroyDistrict = (): void => {
        if (districtToDelete === null) {
            return;
        }

        setIsDeleting(true);

        router.delete(DistrictController.destroy.url(districtToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDistrictToDelete(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Districts" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className={elevatedIndexTableStyles.shell}>
                    <div className={elevatedIndexTableStyles.band}>
                        <div className={elevatedIndexTableStyles.headerActions}>
                            <Button
                                asChild
                                className={
                                    elevatedIndexTableStyles.primaryButton
                                }
                            >
                                <Link href={DistrictController.create()}>
                                    <Plus className="size-4" />
                                    New district
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className={districtTableClassName}>
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
                                        District
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Description
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-center`}
                                    >
                                        Status
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                    >
                                        Sections
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
                                {districts.length === 0 ? (
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
                                                    No districts yet.
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    Create the first district to
                                                    start organizing sections
                                                    and pastors.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    districts.map((district) => (
                                        <tr
                                            key={district.id}
                                            className={
                                                elevatedIndexTableStyles.row
                                            }
                                        >
                                            <td
                                                className={`${elevatedIndexTableStyles.firstCell} min-w-[14rem]`}
                                            >
                                                <span
                                                    className={
                                                        elevatedIndexTableStyles.primaryText
                                                    }
                                                    title={district.name}
                                                >
                                                    {district.name}
                                                </span>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} min-w-[20rem]`}
                                            >
                                                <span
                                                    className={
                                                        elevatedIndexTableStyles.secondaryText
                                                    }
                                                    title={
                                                        district.description ??
                                                        'No description provided.'
                                                    }
                                                >
                                                    {district.description ||
                                                        'No description provided.'}
                                                </span>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-center`}
                                            >
                                                <DataTableBadge
                                                    tone={resolveDataTableTone(
                                                        district.status,
                                                        {
                                                            active: 'emerald',
                                                            inactive: 'rose',
                                                        },
                                                    )}
                                                    className="mx-auto"
                                                >
                                                    {district.status}
                                                </DataTableBadge>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-right`}
                                            >
                                                <span
                                                    className={
                                                        elevatedIndexTableStyles.primaryText
                                                    }
                                                >
                                                    {district.sections_count}
                                                </span>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.lastCellRight} text-right`}
                                            >
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.actionGroup
                                                    }
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-md"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={DistrictController.edit(
                                                                district.id,
                                                            )}
                                                        >
                                                            <PencilLine className="size-4" />
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="rounded-md"
                                                        onClick={() =>
                                                            setDistrictToDelete(
                                                                district,
                                                            )
                                                        }
                                                    >
                                                        <Archive className="size-4" />
                                                        Archive
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ConfirmActionDialog
                    open={districtToDelete !== null}
                    onOpenChange={(open) => {
                        if (!open && !isDeleting) {
                            setDistrictToDelete(null);
                        }
                    }}
                    title="Archive district"
                    description="This archives the district and its related sections and pastors while preserving historical records."
                    confirmLabel="Archive district"
                    confirmVariant="destructive"
                    processing={isDeleting}
                    details={
                        districtToDelete
                            ? `"${districtToDelete.name}" will be archived and removed from active directory lists.`
                            : undefined
                    }
                    onConfirm={destroyDistrict}
                />
            </div>
        </AppLayout>
    );
}
