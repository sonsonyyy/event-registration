import { Head, Link, router } from '@inertiajs/react';
import { Archive, PencilLine, Plus } from 'lucide-react';
import { useState } from 'react';
import SectionController from '@/actions/App/Http/Controllers/Admin/SectionController';
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

const sectionTableClassName = `${elevatedIndexTableStyles.table} min-w-[70rem]`;

export default function SectionIndex({ sections }: Props) {
    const [sectionToDelete, setSectionToDelete] = useState<Section | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const destroySection = (): void => {
        if (sectionToDelete === null) {
            return;
        }

        setIsDeleting(true);

        router.delete(SectionController.destroy.url(sectionToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setSectionToDelete(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sections" />

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
                                <Link href={SectionController.create()}>
                                    <Plus className="size-4" />
                                    New section
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className={sectionTableClassName}>
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
                                        Section
                                    </th>
                                    <th
                                        className={
                                            elevatedIndexTableStyles.headerCell
                                        }
                                    >
                                        Description
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-left`}
                                    >
                                        District
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-right`}
                                    >
                                        Pastors
                                    </th>
                                    <th
                                        className={`${elevatedIndexTableStyles.headerCell} text-center`}
                                    >
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
                                                    No sections yet.
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    Create the first section to
                                                    group pastors under a
                                                    district.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sections.map((section) => (
                                        <tr
                                            key={section.id}
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
                                                    title={section.name}
                                                >
                                                    {section.name}
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
                                                        section.description ??
                                                        'No description provided.'
                                                    }
                                                >
                                                    {section.description ||
                                                        'No description provided.'}
                                                </span>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-left`}
                                            >
                                                <span
                                                    className={
                                                        elevatedIndexTableStyles.primaryText
                                                    }
                                                >
                                                    {section.district.name}
                                                </span>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-right`}
                                            >
                                                <span
                                                    className={
                                                        elevatedIndexTableStyles.primaryText
                                                    }
                                                >
                                                    {section.pastors_count}
                                                </span>
                                            </td>
                                            <td
                                                className={`${elevatedIndexTableStyles.cell} text-center`}
                                            >
                                                <DataTableBadge
                                                    tone={resolveDataTableTone(
                                                        section.status,
                                                        {
                                                            active: 'emerald',
                                                            inactive: 'rose',
                                                        },
                                                    )}
                                                    className="mx-auto"
                                                >
                                                    {section.status}
                                                </DataTableBadge>
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
                                                            href={SectionController.edit(
                                                                section.id,
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
                                                            setSectionToDelete(
                                                                section,
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
                    open={sectionToDelete !== null}
                    onOpenChange={(open) => {
                        if (!open && !isDeleting) {
                            setSectionToDelete(null);
                        }
                    }}
                    title="Archive section"
                    description="This archives the section and its pastor records while preserving historical registrations and assignments."
                    confirmLabel="Archive section"
                    confirmVariant="destructive"
                    processing={isDeleting}
                    details={
                        sectionToDelete
                            ? `"${sectionToDelete.name}" will be archived under ${sectionToDelete.district.name}.`
                            : undefined
                    }
                    onConfirm={destroySection}
                />
            </div>
        </AppLayout>
    );
}
