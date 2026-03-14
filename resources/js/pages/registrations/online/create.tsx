import { Head } from '@inertiajs/react';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type Props = {
    assignedPastor: AssignedPastor;
    events: EventOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Online Registration',
        href: OnlineRegistrationController.index(),
    },
    {
        title: 'Create',
        href: OnlineRegistrationController.create(),
    },
];

export default function CreateOnlineRegistration({
    assignedPastor,
    events,
}: Props) {
    const hasUnavailableDependencies = assignedPastor === null || events.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Online Registration" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Create online registration"
                    description="Register grouped delegates for your assigned church and upload proof of payment during submission."
                />

                {hasUnavailableDependencies && (
                    <Card className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                        <CardHeader>
                            <CardTitle>Setup required</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {assignedPastor === null && (
                                <p>
                                    Your account is not yet assigned to a church
                                    or pastor record.
                                </p>
                            )}
                            {events.length === 0 && (
                                <p>
                                    No open events with available fee
                                    categories are ready for online
                                    registration.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                <OnlineRegistrationForm
                    assignedPastor={assignedPastor}
                    events={events}
                />
            </div>
        </AppLayout>
    );
}
