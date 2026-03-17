import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import Heading from '@/components/heading';
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
                <Heading
                    title="Districts"
                    description="Manage the top-level district records used to organize sections and pastors."
                    className="mb-4"
                />

                <div className={elevatedIndexTableStyles.shell}>
                    <div className={elevatedIndexTableStyles.band}>
                        <div className={elevatedIndexTableStyles.headerActions}>
                            <Button
                                asChild
                                className={elevatedIndexTableStyles.primaryButton}
                            >
                                <Link href={DistrictController.create()}>
                                    New district
                                </Link>
                            </Button>
                        </div>
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
                                    District
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Status
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
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
                                            colSpan={4}
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
                                                    Create the first district to start
                                                    organizing sections and pastors.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    districts.map((district) => (
                                        <tr
                                            key={district.id}
                                            className={elevatedIndexTableStyles.row}
                                        >
                                            <td className={elevatedIndexTableStyles.firstCell}>
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {district.name}
                                            </div>
                                            <div className={elevatedIndexTableStyles.secondaryText}>
                                                {district.description ||
                                                    'No description provided.'}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <DataTableBadge
                                                tone={resolveDataTableTone(
                                                    district.status,
                                                    {
                                                        active: 'emerald',
                                                        inactive: 'rose',
                                                    },
                                                )}
                                            >
                                                {district.status}
                                            </DataTableBadge>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {district.sections_count}
                                            </div>
                                            <div className={elevatedIndexTableStyles.secondaryText}>
                                                sections
                                            </div>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.lastCellRight} text-right`}
                                            >
                                            <div className={elevatedIndexTableStyles.actionGroup}>
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
