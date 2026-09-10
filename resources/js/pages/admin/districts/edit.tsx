import { Head } from '@inertiajs/react';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import DistrictForm from './form';

type District = {
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
    district: District;
    statusOptions: StatusOption[];
};

export default function EditDistrict({ district, statusOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Districts',
            href: DistrictController.index(),
        },
        {
            title: district.name,
            href: DistrictController.edit(district.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${district.name}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <DistrictForm
                    district={district}
                    minimalLayout
                    statusOptions={statusOptions}
                />
            </div>
        </AppLayout>
    );
}
