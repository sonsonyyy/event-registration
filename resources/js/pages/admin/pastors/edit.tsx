import { Head } from '@inertiajs/react';
import PastorController from '@/actions/App/Http/Controllers/Admin/PastorController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import PastorForm from './form';

type Pastor = {
    id: number;
    pastor_name: string;
    church_name: string;
    contact_number: string | null;
    email: string | null;
    address: string | null;
    status: string;
    section: {
        id: number;
        name: string;
        district_name: string;
    };
};

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
    pastor: Pastor;
    sections: SectionOption[];
    statusOptions: StatusOption[];
};

export default function EditPastor({
    pastor,
    sections,
    statusOptions,
}: Props) {
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
            title: pastor.church_name,
            href: PastorController.edit(pastor.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${pastor.church_name}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title={`Edit ${pastor.church_name}`}
                    description="Update the pastor, church, and section assignment details."
                />
                <PastorForm
                    pastor={pastor}
                    minimalLayout
                    sections={sections}
                    statusOptions={statusOptions}
                />
            </div>
        </AppLayout>
    );
}
