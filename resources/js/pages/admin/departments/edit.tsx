import { Head } from '@inertiajs/react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import DepartmentForm from './form';

type Department = {
    id: number;
    name: string;
    description: string | null;
    status: string;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    department: Department;
    statusOptions: StatusOption[];
};

export default function EditDepartment({ department, statusOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Departments',
            href: DepartmentController.index(),
        },
        {
            title: department.name,
            href: DepartmentController.edit(department.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${department.name}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title={`Edit ${department.name}`}
                    description="Update the department record used for scoped leadership accounts and events."
                />
                <DepartmentForm
                    department={department}
                    minimalLayout
                    statusOptions={statusOptions}
                />
            </div>
        </AppLayout>
    );
}
