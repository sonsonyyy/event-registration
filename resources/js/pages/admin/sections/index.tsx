import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import SectionController from '@/actions/App/Http/Controllers/Admin/SectionController';
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

type Section = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    pastors_count: number;
    district: {
        id: number;
        name: string;
    };
};

type Props = {
    sections: Section[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Sections',
        href: SectionController.index(),
    },
];

export default function SectionIndex({ sections }: Props) {
    const page = usePage();
    const flash = page.props.flash as { success?: string | null } | undefined;
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);

    const destroy = (section: Section): void => {
        if (! window.confirm(`Delete "${section.name}"? This will also remove its pastors.`)) {
            return;
        }

        router.delete(SectionController.destroy.url(section.id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sections" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Sections"
                    description="Create and maintain the section records that sit beneath each district."
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
                                <Link href={SectionController.create()}>
                                    New section
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
                                    Section
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    District
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                    Pastors
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
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
                                {sections.length === 0 ? (
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
                                                    No sections yet.
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    Create the first section to group
                                                    pastors under a district.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sections.map((section) => (
                                        <tr
                                            key={section.id}
                                            className={elevatedIndexTableStyles.row}
                                        >
                                            <td className={elevatedIndexTableStyles.firstCell}>
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {section.name}
                                            </div>
                                            <div className={elevatedIndexTableStyles.secondaryText}>
                                                {section.description ||
                                                    'No description provided.'}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {section.district.name}
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <div className={elevatedIndexTableStyles.primaryText}>
                                                {section.pastors_count}
                                            </div>
                                            <div className={elevatedIndexTableStyles.secondaryText}>
                                                pastor records
                                            </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                            <DataTableBadge
                                                tone={resolveDataTableTone(
                                                    section.status,
                                                    {
                                                        active: 'emerald',
                                                        inactive: 'rose',
                                                    },
                                                )}
                                            >
                                                {section.status}
                                            </DataTableBadge>
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
                                                        setSelectedSection(
                                                            section,
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
                                                        href={SectionController.edit(
                                                            section.id,
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
                                                        destroy(section)
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
                    open={selectedSection !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedSection(null);
                        }
                    }}
                    title={
                        selectedSection
                            ? `Section: ${selectedSection.name}`
                            : 'Section'
                    }
                    description="Review the section scope, district assignment, and pastor count."
                    badges={
                        selectedSection ? (
                            <DataTableBadge
                                tone={resolveDataTableTone(
                                    selectedSection.status,
                                    {
                                        active: 'emerald',
                                        inactive: 'rose',
                                    },
                                )}
                            >
                                {selectedSection.status}
                            </DataTableBadge>
                        ) : null
                    }
                    sections={
                        selectedSection
                            ? [
                                  {
                                      title: 'Details',
                                      fields: [
                                          {
                                              label: 'Section',
                                              value: selectedSection.name,
                                          },
                                          {
                                              label: 'District',
                                              value: selectedSection.district.name,
                                          },
                                          {
                                              label: 'Pastor records',
                                              value: `${selectedSection.pastors_count} pastors`,
                                          },
                                          {
                                              label: 'Description',
                                              value:
                                                  selectedSection.description ??
                                                  'No description provided.',
                                              fullWidth: true,
                                          },
                                      ],
                                  },
                              ]
                            : []
                    }
                    footer={
                        selectedSection ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedSection(null)}
                                >
                                    Close
                                </Button>
                                <Button asChild variant="outline">
                                    <Link
                                        href={SectionController.edit(
                                            selectedSection.id,
                                        )}
                                    >
                                        Edit section
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
