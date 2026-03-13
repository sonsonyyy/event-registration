import { Head, Link, router, usePage } from '@inertiajs/react';
import EventController from '@/actions/App/Http/Controllers/Admin/EventController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

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
    status_reason: string | null;
    fee_categories_count: number;
    reserved_quantity: number;
    total_capacity: number;
    remaining_slots: number;
    accepting_registrations: boolean;
};

type Props = {
    events: EventRecord[];
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
];

const formatDate = (value: string): string =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(new Date(value));

const formatDateTime = (value: string): string =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));

export default function EventIndex({ events }: Props) {
    const page = usePage();
    const flash = page.props.flash as { success?: string | null } | undefined;

    const destroy = (event: EventRecord): void => {
        if (
            ! window.confirm(
                `Delete "${event.name}"? This also removes its fee categories and registrations.`,
            )
        ) {
            return;
        }

        router.delete(EventController.destroy.url(event.id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Events" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <Heading
                        title="Events"
                        description="Manage event schedules, fee categories, and registration capacity in one place."
                    />
                    <Button asChild>
                        <Link href={EventController.create()}>
                            New event
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
                        <CardTitle>Event directory</CardTitle>
                        <CardDescription>
                            Remaining slots are computed live from reserved
                            registration quantities.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-3 pr-4 font-medium">
                                        Event
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Schedule
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Registration
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Capacity
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Fees
                                    </th>
                                    <th className="py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/50">
                                {events.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No events yet.
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((event) => (
                                        <tr key={event.id}>
                                            <td className="py-4 pr-4 align-top">
                                                <div className="font-medium">
                                                    {event.name}
                                                </div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {event.venue}
                                                </div>
                                                <div className="mt-1 max-w-xl text-sm text-muted-foreground">
                                                    {event.description ||
                                                        'No description provided.'}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top text-muted-foreground">
                                                <div>
                                                    {formatDate(event.date_from)}{' '}
                                                    to {formatDate(event.date_to)}
                                                </div>
                                                <div className="mt-1 text-xs uppercase tracking-wide">
                                                    Opens{' '}
                                                    {formatDateTime(
                                                        event.registration_open_at,
                                                    )}
                                                </div>
                                                <div className="mt-1 text-xs uppercase tracking-wide">
                                                    Closes{' '}
                                                    {formatDateTime(
                                                        event.registration_close_at,
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant={
                                                            event.status ===
                                                                'open' &&
                                                            event.accepting_registrations
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                        className="capitalize"
                                                    >
                                                        {event.status}
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            event.accepting_registrations
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                    >
                                                        {event.accepting_registrations
                                                            ? 'Accepting'
                                                            : 'Not accepting'}
                                                    </Badge>
                                                </div>
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    {event.status_reason ||
                                                        'Registration rules are satisfied.'}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top text-muted-foreground">
                                                <div>
                                                    Reserved{' '}
                                                    {event.reserved_quantity}
                                                </div>
                                                <div className="mt-1">
                                                    Remaining{' '}
                                                    {event.remaining_slots} /{' '}
                                                    {event.total_capacity}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top text-muted-foreground">
                                                {event.fee_categories_count}
                                            </td>
                                            <td className="py-4 align-top">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={EventController.edit(
                                                                event.id,
                                                            )}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            destroy(event)
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
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
