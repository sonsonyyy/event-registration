import { Head } from '@inertiajs/react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import DepartmentForm from './form';

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    statusOptions: StatusOption[];
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
    {
        title: 'Create department',
        href: DepartmentController.create(),
    },
];

export default function CreateDepartment({ statusOptions }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Department" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Create department"
                    description="Add a department before assigning it to users or department-specific events."
                />
                <DepartmentForm minimalLayout statusOptions={statusOptions} />
            </div>
        </AppLayout>
    );
}
