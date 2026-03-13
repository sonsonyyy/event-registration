import { Head } from '@inertiajs/react';
import PastorController from '@/actions/App/Http/Controllers/Admin/PastorController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import PastorForm from './form';

type SectionOption = {
    id: number;
    name: string;
    district_name: string;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    sections: SectionOption[];
    statusOptions: StatusOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Pastors',
        href: PastorController.index(),
    },
    {
        title: 'Create pastor record',
        href: PastorController.create(),
    },
];

export default function CreatePastor({ sections, statusOptions }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Pastor Record" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Create pastor record"
                    description="Add the church account owner record used for registration and reporting."
                />
                <PastorForm
                    minimalLayout
                    sections={sections}
                    statusOptions={statusOptions}
                />
            </div>
        </AppLayout>
    );
}
