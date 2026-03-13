import { Head } from '@inertiajs/react';
import SectionController from '@/actions/App/Http/Controllers/Admin/SectionController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import SectionForm from './form';

type DistrictOption = {
    id: number;
    name: string;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    districts: DistrictOption[];
    statusOptions: StatusOption[];
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
    {
        title: 'Create section',
        href: SectionController.create(),
    },
];

export default function CreateSection({ districts, statusOptions }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Section" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Create section"
                    description="Add a section and connect it to the district that owns it."
                />
                <SectionForm
                    districts={districts}
                    minimalLayout
                    statusOptions={statusOptions}
                />
            </div>
        </AppLayout>
    );
}
