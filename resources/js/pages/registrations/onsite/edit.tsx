import { Head } from '@inertiajs/react';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import OnsiteRegistrationForm from './form';

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
    date_from: string;
    date_to: string;
    registration_close_at: string;
    remaining_slots: number;
    fee_categories: FeeCategoryOption[];
};

type PastorOption = {
    id: number;
    pastor_name: string;
    church_name: string;
    section_id: number;
    section_name: string;
    district_id: number;
    district_name: string;
};

type EditableRegistration = {
    id: number;
    event_id: string;
    pastor_id: string;
    payment_reference: string | null;
    registration_status: string;
    remarks: string | null;
    submitted_at: string | null;
    line_items: Array<{
        fee_category_id: string;
        quantity: string;
    }>;
};

type Props = {
    events: EventOption[];
    pastors: PastorOption[];
    registration: EditableRegistration;
};

const breadcrumbs = (registrationId: number): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Onsite Registration',
        href: OnsiteRegistrationController.index(),
    },
    {
        title: `Edit #${registrationId}`,
        href: OnsiteRegistrationController.edit(registrationId),
    },
];

export default function EditOnsiteRegistration({
    events,
    pastors,
    registration,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs(registration.id)}>
            <Head title="Edit Onsite Registration" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Edit onsite registration"
                    description="Correct church assignment, grouped quantities, and reference details for this onsite transaction."
                />

                <OnsiteRegistrationForm
                    events={events}
                    pastors={pastors}
                    registration={registration}
                />
            </div>
        </AppLayout>
    );
}
