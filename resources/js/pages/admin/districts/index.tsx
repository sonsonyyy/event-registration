import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import { elevatedIndexTableStyles } from '@/components/data-table-presets';
import EntityRecordDialog from '@/components/entity-record-dialog';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { successNoticeClassName } from '@/lib/ui-styles';
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
    const page = usePage();
    const flash = page.props.flash as { success?: string | null } | undefined;
    const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
        null,
    );

    const destroy = (district: District): void => {
        if (! window.confirm(`Delete "${district.name}"? This will also remove its sections and pastors.`)) {
            return;
        }

        router.delete(DistrictController.destroy.url(district.id), {
            preserveScroll: true,
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

                {flash?.success && (
                    <div className={successNoticeClassName}>
                        {flash.success}
                    </div>
                )}

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
                                                    onClick={() =>
                                                        setSelectedDistrict(
                                                            district,
                                                        )
                                                    }
                                                >
                                                    View
                                                </Button>
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
                                                        destroy(district)
                                                    }
                                                >
                                                    Delete
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

                <EntityRecordDialog
                    open={selectedDistrict !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedDistrict(null);
                        }
                    }}
                    title={
                        selectedDistrict
                            ? `District: ${selectedDistrict.name}`
                            : 'District'
                    }
                    description="Review the district details and current structure count."
                    badges={
                        selectedDistrict ? (
                            <DataTableBadge
                                tone={resolveDataTableTone(
                                    selectedDistrict.status,
                                    {
                                        active: 'emerald',
                                        inactive: 'rose',
                                    },
                                )}
                            >
                                {selectedDistrict.status}
                            </DataTableBadge>
                        ) : null
                    }
                    sections={
                        selectedDistrict
                            ? [
                                  {
                                      title: 'Details',
                                      fields: [
                                          {
                                              label: 'District',
                                              value: selectedDistrict.name,
                                          },
                                          {
                                              label: 'Sections',
                                              value: `${selectedDistrict.sections_count} sections`,
                                          },
                                          {
                                              label: 'Description',
                                              value:
                                                  selectedDistrict.description ??
                                                  'No description provided.',
                                              fullWidth: true,
                                          },
                                      ],
                                  },
                              ]
                            : []
                    }
                    footer={
                        selectedDistrict ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedDistrict(null)}
                                >
                                    Close
                                </Button>
                                <Button asChild variant="outline">
                                    <Link
                                        href={DistrictController.edit(
                                            selectedDistrict.id,
                                        )}
                                    >
                                        Edit district
                                    </Link>
                                </Button>
                            </div>
                        ) : null
                    }
                />
            </div>
        </AppLayout>
    );
}
