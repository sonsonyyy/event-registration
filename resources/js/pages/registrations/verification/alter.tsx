import { Head } from '@inertiajs/react';
import RegistrationAlterationController from '@/actions/App/Http/Controllers/RegistrationAlterationController';
import RegistrationVerificationController from '@/actions/App/Http/Controllers/RegistrationVerificationController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatSystemDateTime } from '@/lib/date-time';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import OnlineRegistrationForm from '../online/form';

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

type AlterationHistoryRecord = {
    id: number;
    altered_at: string | null;
    altered_by: {
        id: number;
        name: string;
    } | null;
    snapshot: {
        event_name: string | null;
        church_name: string | null;
        pastor_name: string | null;
        payment_reference: string | null;
        registration_status: string | null;
        remarks: string | null;
        total_quantity: number;
        total_amount: string;
        line_items: Array<{
            category_name: string;
            quantity: number;
            unit_amount: string;
            subtotal_amount: string;
        }>;
    };
};

type Props = {
    assignedPastor: AssignedPastor;
    events: EventOption[];
    registration: EditableRegistration;
    alterationHistory: AlterationHistoryRecord[];
};

const breadcrumbs = (registrationId: number): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Verification',
        href: RegistrationVerificationController.index(),
    },
    {
        title: `Alter #${registrationId}`,
        href: RegistrationAlterationController.edit(registrationId),
    },
];

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

const formatDateTime = (value: string | null): string =>
    value ? formatSystemDateTime(value) : 'Not available';

export default function AlterRegistrationVerification({
    assignedPastor,
    events,
    registration,
    alterationHistory,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs(registration.id)}>
            <Head title="Alter Registration" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Alter registration"
                    description="Update the online registration, then keep the previous record snapshot in the alteration history."
                />

                <OnlineRegistrationForm
                    assignedPastor={assignedPastor}
                    events={events}
                    registration={registration}
                    submitAction={RegistrationAlterationController.update(
                        registration.id,
                    )}
                    cancelHref={RegistrationVerificationController.index().url}
                    submitLabel="Save alteration"
                    churchCardLabel="Church on record"
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Alteration history</CardTitle>
                        <CardDescription>
                            Each entry shows the saved registration snapshot
                            from before the latest alteration was applied.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {alterationHistory.length === 0 ? (
                            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                                No alteration history yet. The first saved
                                change will appear here automatically.
                            </div>
                        ) : (
                            alterationHistory.map((history) => (
                                <div
                                    key={history.id}
                                    className="rounded-md border border-sidebar-border/70 bg-background p-4"
                                >
                                    <div className="flex flex-col gap-3 border-b border-sidebar-border/70 pb-4 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-1">
                                            <div className="text-sm font-semibold text-slate-900">
                                                {history.snapshot.event_name ??
                                                    'Saved registration snapshot'}
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                {history.snapshot.church_name ??
                                                    assignedPastor?.church_name ??
                                                    'Church not available'}
                                                {' - '}
                                                {history.snapshot.pastor_name ??
                                                    assignedPastor?.pastor_name ??
                                                    'Pastor not available'}
                                            </div>
                                        </div>

                                        <div className="space-y-1 text-sm text-slate-600 md:text-right">
                                            <div className="font-medium text-slate-900">
                                                {history.altered_by?.name ??
                                                    'System'}
                                            </div>
                                            <div>
                                                {formatDateTime(
                                                    history.altered_at,
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                                Status
                                            </div>
                                            <div className="mt-1">
                                                <Badge
                                                    variant="secondary"
                                                    className="capitalize"
                                                >
                                                    {history.snapshot
                                                        .registration_status ??
                                                        'Unknown'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                                Reference
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                                {history.snapshot
                                                    .payment_reference ??
                                                    'Not provided'}
                                            </div>
                                        </div>

                                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                                Total quantity
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                                {history.snapshot.total_quantity}
                                            </div>
                                        </div>

                                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                                Total amount
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                                {formatCurrency(
                                                    history.snapshot
                                                        .total_amount,
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {history.snapshot.remarks && (
                                        <div className="mt-4 rounded-md border border-amber-200/70 bg-amber-50/80 px-3 py-3 text-sm text-amber-950">
                                            {history.snapshot.remarks}
                                        </div>
                                    )}

                                    <div className="mt-4 space-y-3">
                                        <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                            Saved line items
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {history.snapshot.line_items.map(
                                                (lineItem, index) => (
                                                    <div
                                                        key={`${history.id}-${index}`}
                                                        className="rounded-md border border-sidebar-border/70 px-3 py-3"
                                                    >
                                                        <div className="text-sm font-semibold text-slate-900">
                                                            {
                                                                lineItem.category_name
                                                            }
                                                        </div>
                                                        <div className="mt-1 text-sm text-slate-600">
                                                            Qty{' '}
                                                            {lineItem.quantity}
                                                            {' · '}
                                                            {formatCurrency(
                                                                lineItem.unit_amount,
                                                            )}{' '}
                                                            each
                                                        </div>
                                                        <div className="mt-1 text-sm font-medium text-slate-900">
                                                            {formatCurrency(
                                                                lineItem.subtotal_amount,
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
