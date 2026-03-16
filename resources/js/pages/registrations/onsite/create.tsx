import { Head } from '@inertiajs/react';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type Props = {
    events: EventOption[];
    pastors: PastorOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Onsite Registration',
        href: OnsiteRegistrationController.index(),
    },
    {
        title: 'Create',
        href: OnsiteRegistrationController.create(),
    },
];

export default function CreateOnsiteRegistration({
    events,
    pastors,
}: Props) {
    const hasUnavailableDependencies = events.length === 0 || pastors.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Onsite Registration" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Create onsite registration"
                    description="Capture walk-in quantities by fee category without collecting delegate-level details."
                />

                {hasUnavailableDependencies && (
                    <Card className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                        <CardHeader>
                            <CardTitle>Setup required</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {events.length === 0 && (
                                <p>
                                    No open events with available fee categories
                                    are ready for onsite registration.
                                </p>
                            )}
                            {pastors.length === 0 && (
                                <p>
                                    No active pastors are available within your
                                    scope.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                <OnsiteRegistrationForm
                    events={events}
                    pastors={pastors}
                />
            </div>
        </AppLayout>
    );
}
