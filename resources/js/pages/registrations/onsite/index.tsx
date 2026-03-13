import { Head, Link, usePage } from '@inertiajs/react';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type RegistrationItemRecord = {
    id: number;
    category_name: string;
    quantity: number;
    unit_amount: string;
    subtotal_amount: string;
};

type RegistrationRecord = {
    id: number;
    event: {
        id: number;
        name: string;
    };
    pastor: {
        id: number;
        pastor_name: string;
        church_name: string;
        section_name: string;
        district_name: string;
    };
    payment_status: string;
    payment_reference: string | null;
    registration_status: string;
    total_quantity: number;
    total_amount: string;
    remarks: string | null;
    submitted_at: string | null;
    encoded_by: {
        id: number;
        name: string;
    };
    items: RegistrationItemRecord[];
};

type Props = {
    registrations: RegistrationRecord[];
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
];

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

const formatDate = (value: string | null): string => {
    if (! value) {
        return 'Not submitted';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
};

export default function OnsiteRegistrationIndex({ registrations }: Props) {
    const page = usePage();
    const flash = page.props.flash as { success?: string | null } | undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Onsite Registration" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <Heading
                        title="Onsite registration"
                        description="Record walk-in quantities with multiple fee-category items in a single transaction."
                    />
                    <Button asChild>
                        <Link href={OnsiteRegistrationController.create()}>
                            New onsite transaction
                        </Link>
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                        {flash.success}
                    </div>
                )}

                <Card className="border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>Recorded transactions</CardTitle>
                        <CardDescription>
                            Staff see their own onsite entries. Managers see
                            onsite registrations within their assigned section.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-3 pr-4 font-medium">
                                        Transaction
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Church
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Items
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Totals
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Payment
                                    </th>
                                    <th className="py-3 font-medium">
                                        Encoded by
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/50">
                                {registrations.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No onsite registrations yet.
                                        </td>
                                    </tr>
                                ) : (
                                    registrations.map((registration) => (
                                        <tr key={registration.id}>
                                            <td className="py-4 pr-4 align-top">
                                                <div className="font-medium">
                                                    #{registration.id} ·{' '}
                                                    {registration.event.name}
                                                </div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {formatDate(
                                                        registration.submitted_at,
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="capitalize"
                                                    >
                                                        {
                                                            registration.registration_status
                                                        }
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top">
                                                <div className="font-medium">
                                                    {
                                                        registration.pastor
                                                            .church_name
                                                    }
                                                </div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {
                                                        registration.pastor
                                                            .pastor_name
                                                    }
                                                </div>
                                                <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                                                    {
                                                        registration.pastor
                                                            .section_name
                                                    }{' '}
                                                    ·{' '}
                                                    {
                                                        registration.pastor
                                                            .district_name
                                                    }
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top">
                                                <div className="space-y-2">
                                                    {registration.items.map(
                                                        (item) => (
                                                            <div
                                                                key={item.id}
                                                                className="rounded-lg border border-sidebar-border/60 px-3 py-2"
                                                            >
                                                                <div className="font-medium">
                                                                    {
                                                                        item.category_name
                                                                    }
                                                                </div>
                                                                <div className="mt-1 text-sm text-muted-foreground">
                                                                    {
                                                                        item.quantity
                                                                    }{' '}
                                                                    x{' '}
                                                                    {formatCurrency(
                                                                        item.unit_amount,
                                                                    )}{' '}
                                                                    ={' '}
                                                                    {formatCurrency(
                                                                        item.subtotal_amount,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top text-muted-foreground">
                                                <div>
                                                    Quantity{' '}
                                                    {
                                                        registration.total_quantity
                                                    }
                                                </div>
                                                <div className="mt-1 font-medium text-foreground">
                                                    {formatCurrency(
                                                        registration.total_amount,
                                                    )}
                                                </div>
                                                {registration.remarks && (
                                                    <div className="mt-2 max-w-sm text-sm">
                                                        {registration.remarks}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 pr-4 align-top">
                                                <Badge
                                                    variant={
                                                        registration.payment_status ===
                                                        'paid'
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {
                                                        registration.payment_status
                                                    }
                                                </Badge>
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    {registration.payment_reference ??
                                                        'No receipt reference'}
                                                </div>
                                            </td>
                                            <td className="py-4 align-top text-muted-foreground">
                                                {
                                                    registration.encoded_by
                                                        .name
                                                }
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
