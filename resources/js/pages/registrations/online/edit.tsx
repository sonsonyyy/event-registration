import { Head } from '@inertiajs/react';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import OnlineRegistrationForm from './form';

type FeeCategoryOption = {
    id: number;
    category_name: string;
    amount: string;
    slot_limit: number | null;
    remaining_slots: number | null;
    status: string;
};

type EventOption = {
    id: number;
    name: string;
    venue: string;
    description: string;
    date_from: string;
    date_to: string;
    registration_close_at: string;
    remaining_slots: number;
    fee_categories: FeeCategoryOption[];
};

type AssignedPastor = {
    id: number;
    pastor_name: string;
    church_name: string;
    section_name: string;
    district_name: string;
    status: string;
} | null;

type ReviewRecord = {
    id: number;
    decision: string;
    reason: string | null;
    notes: string | null;
    decided_at: string | null;
    reviewer: {
        id: number;
        name: string;
    } | null;
};

type EditableRegistration = {
    id: number;
    event_id: string;
    payment_reference: string | null;
    registration_status: string;
    remarks: string | null;
    submitted_at: string | null;
    receipt: {
        original_name: string | null;
        uploaded_at: string | null;
    };
    latest_review: ReviewRecord | null;
    review_history: ReviewRecord[];
    line_items: Array<{
        fee_category_id: string;
        quantity: string;
    }>;
};

type Props = {
    assignedPastor: AssignedPastor;
    events: EventOption[];
    registration: EditableRegistration;
};

const breadcrumbs = (registrationId: number): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Online Registration',
        href: OnlineRegistrationController.index(),
    },
    {
        title: `Edit #${registrationId}`,
        href: OnlineRegistrationController.edit(registrationId),
    },
];

export default function EditOnlineRegistration({
    assignedPastor,
    events,
    registration,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs(registration.id)}>
            <Head title="Edit Online Registration" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Edit online registration"
                    description="Update grouped quantities, proof of payment, and notes before the registration is finalized."
                />

                <OnlineRegistrationForm
                    assignedPastor={assignedPastor}
                    events={events}
                    registration={registration}
                />
            </div>
        </AppLayout>
    );
}
