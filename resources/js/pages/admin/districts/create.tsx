import { Head } from '@inertiajs/react';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import DistrictForm from './form';

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
        title: 'Districts',
        href: DistrictController.index(),
    },
    {
        title: 'Create district',
        href: DistrictController.create(),
    },
];

export default function CreateDistrict({ statusOptions }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create District" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Create district"
                    description="Add a district before you assign sections beneath it."
                />
                <DistrictForm minimalLayout statusOptions={statusOptions} />
            </div>
        </AppLayout>
    );
}
