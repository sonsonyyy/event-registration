import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
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

type Department = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    assigned_users_count: number;
    events_count: number;
};

type Props = {
    departments: Department[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Departments',
        href: DepartmentController.index(),
    },
];

export default function DepartmentIndex({ departments }: Props) {
    const [departmentToDelete, setDepartmentToDelete] =
        useState<Department | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const destroyDepartment = (): void => {
        if (departmentToDelete === null) {
            return;
        }

        setIsDeleting(true);

        router.delete(DepartmentController.destroy.url(departmentToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDepartmentToDelete(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departments" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Departments"
                    description="Manage the departments that can own events and be assigned to leadership accounts."
                    className="mb-4"
                />

                <div className={elevatedIndexTableStyles.shell}>
                    <div className={elevatedIndexTableStyles.band}>
                        <div className={elevatedIndexTableStyles.headerActions}>
                            <Button
                                asChild
                                className={elevatedIndexTableStyles.primaryButton}
                            >
                                <Link href={DepartmentController.create()}>
                                    New department
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className={elevatedIndexTableStyles.table}>
                            <thead className={elevatedIndexTableStyles.thead}>
                                <tr className={elevatedIndexTableStyles.headerRow}>
                                    <th className={elevatedIndexTableStyles.firstHeaderCell}>
                                        Department
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Status
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Users
                                    </th>
                                    <th className={elevatedIndexTableStyles.headerCell}>
                                        Events
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
                                {departments.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className={elevatedIndexTableStyles.emptyCell}
                                        >
                                            <div className="space-y-2">
                                                <div className={elevatedIndexTableStyles.emptyTitle}>
                                                    No departments yet.
                                                </div>
                                                <div
                                                    className={
                                                        elevatedIndexTableStyles.emptyDescription
                                                    }
                                                >
                                                    Create a department before assigning it to leaders or events.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    departments.map((department) => (
                                        <tr
                                            key={department.id}
                                            className={elevatedIndexTableStyles.row}
                                        >
                                            <td className={elevatedIndexTableStyles.firstCell}>
                                                <div className={elevatedIndexTableStyles.primaryText}>
                                                    {department.name}
                                                </div>
                                                <div className={elevatedIndexTableStyles.secondaryText}>
                                                    {department.description ||
                                                        'No description provided.'}
                                                </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <DataTableBadge
                                                    tone={resolveDataTableTone(
                                                        department.status,
                                                        {
                                                            active: 'emerald',
                                                            inactive: 'rose',
                                                        },
                                                    )}
                                                >
                                                    {department.status}
                                                </DataTableBadge>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div className={elevatedIndexTableStyles.primaryText}>
                                                    {department.assigned_users_count}
                                                </div>
                                                <div className={elevatedIndexTableStyles.secondaryText}>
                                                    assigned users
                                                </div>
                                            </td>
                                            <td className={elevatedIndexTableStyles.cell}>
                                                <div className={elevatedIndexTableStyles.primaryText}>
                                                    {department.events_count}
                                                </div>
                                                <div className={elevatedIndexTableStyles.secondaryText}>
                                                    linked events
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
                                                            href={DepartmentController.edit(
                                                                department.id,
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
                                                            setDepartmentToDelete(
                                                                department,
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
                    open={departmentToDelete !== null}
                    onOpenChange={(open) => {
                        if (!open && !isDeleting) {
                            setDepartmentToDelete(null);
                        }
                    }}
                    title="Archive department"
                    description="This archives the department and removes it from active selection lists while preserving assigned users, events, and historical registrations."
                    confirmLabel="Archive department"
                    confirmVariant="destructive"
                    processing={isDeleting}
                    details={
                        departmentToDelete
                            ? `"${departmentToDelete.name}" will no longer appear in active department selections.`
                            : undefined
                    }
                    onConfirm={destroyDepartment}
                />
            </div>
        </AppLayout>
    );
}
