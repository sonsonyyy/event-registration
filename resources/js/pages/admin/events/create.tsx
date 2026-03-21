import { Head } from '@inertiajs/react';
import EventController from '@/actions/App/Http/Controllers/Admin/EventController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import EventForm from './form';

type SelectOption = {
    value: string;
    label: string;
};

type Props = {
    statusOptions: SelectOption[];
    scopeTypeOptions: SelectOption[];
    districts: Array<{
        id: number;
        name: string;
        status: string;
    }>;
    sections: Array<{
        id: number;
        name: string;
        district_id: number;
        district_name: string;
        status: string;
    }>;
    departments: Array<{
        id: number;
        name: string;
        status: string;
    }>;
    formDefaults: {
        scope_type: string;
        district_id: number | null;
        section_id: number | null;
        department_id: number | null;
    };
    feeCategoryStatusOptions: SelectOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Events',
        href: EventController.index(),
    },
    {
        title: 'Create event',
        href: EventController.create(),
    },
];

export default function CreateEvent({
    statusOptions,
    scopeTypeOptions,
    districts,
    sections,
    departments,
    formDefaults,
    feeCategoryStatusOptions,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Event" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Create event"
                    description="Set the event schedule, registration window, capacity, and fee categories before opening registration."
                />
                <EventForm
                    statusOptions={statusOptions}
                    scopeTypeOptions={scopeTypeOptions}
                    districts={districts}
                    sections={sections}
                    departments={departments}
                    formDefaults={formDefaults}
                    feeCategoryStatusOptions={feeCategoryStatusOptions}
                />
            </div>
        </AppLayout>
    );
}
