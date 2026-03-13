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

type EventRecord = {
    id: number;
    name: string;
    description: string | null;
    venue: string;
    date_from: string;
    date_to: string;
    registration_open_at: string;
    registration_close_at: string;
    status: string;
    total_capacity: number;
    reserved_quantity: number;
    remaining_slots: number;
    status_reason: string | null;
    accepting_registrations: boolean;
    fee_categories: Array<{
        id?: number;
        category_name: string;
        amount: string;
        slot_limit: number | null;
        status: string;
        reserved_quantity: number;
        remaining_slots: number | null;
    }>;
};

type Props = {
    event: EventRecord;
    statusOptions: SelectOption[];
    feeCategoryStatusOptions: SelectOption[];
};

export default function EditEvent({
    event,
    statusOptions,
    feeCategoryStatusOptions,
}: Props) {
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
            title: event.name,
            href: EventController.edit(event.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${event.name}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title={`Edit ${event.name}`}
                    description="Adjust registration rules and fee categories without breaking existing reservations."
                />
                <EventForm
                    event={event}
                    statusOptions={statusOptions}
                    feeCategoryStatusOptions={feeCategoryStatusOptions}
                />
            </div>
        </AppLayout>
    );
}
