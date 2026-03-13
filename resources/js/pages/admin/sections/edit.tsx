import { Head } from '@inertiajs/react';
import SectionController from '@/actions/App/Http/Controllers/Admin/SectionController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import SectionForm from './form';

type Section = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    district: {
        id: number;
        name: string;
    };
};

type DistrictOption = {
    id: number;
    name: string;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    section: Section;
    districts: DistrictOption[];
    statusOptions: StatusOption[];
};

export default function EditSection({
    section,
    districts,
    statusOptions,
}: Props) {
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
            title: section.name,
            href: SectionController.edit(section.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${section.name}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title={`Edit ${section.name}`}
                    description="Update the section metadata and district assignment."
                />
                <SectionForm
                    section={section}
                    districts={districts}
                    minimalLayout
                    statusOptions={statusOptions}
                />
            </div>
        </AppLayout>
    );
}
