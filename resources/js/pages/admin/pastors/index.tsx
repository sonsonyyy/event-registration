import { Head, Link, router, usePage } from '@inertiajs/react';
import PastorController from '@/actions/App/Http/Controllers/Admin/PastorController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Pastor = {
    id: number;
    pastor_name: string;
    church_name: string;
    contact_number: string;
    email: string | null;
    address: string | null;
    status: string;
    section: {
        id: number;
        name: string;
    };
    district: {
        id: number;
        name: string;
    };
};

type Props = {
    pastors: Pastor[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Pastors',
        href: PastorController.index(),
    },
];

export default function PastorIndex({ pastors }: Props) {
    const page = usePage();
    const flash = page.props.flash as { success?: string | null } | undefined;

    const destroy = (pastor: Pastor): void => {
        if (! window.confirm(`Delete "${pastor.church_name}" and its pastor record?`)) {
            return;
        }

        router.delete(PastorController.destroy.url(pastor.id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pastors" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <Heading
                        title="Pastors and churches"
                        description="Maintain the pastor and church records used by onsite staff and online registrants."
                    />
                    <Button asChild>
                        <Link href={PastorController.create()}>
                            New pastor record
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
                        <CardTitle>Pastor directory</CardTitle>
                        <CardDescription>
                            Each record identifies a pastor, church, section,
                            and district pairing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-3 pr-4 font-medium">
                                        Church
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Section
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Contact
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Status
                                    </th>
                                    <th className="py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/50">
                                {pastors.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No pastor records yet.
                                        </td>
                                    </tr>
                                ) : (
                                    pastors.map((pastor) => (
                                        <tr key={pastor.id}>
                                            <td className="py-4 pr-4 align-top">
                                                <div className="font-medium">
                                                    {pastor.church_name}
                                                </div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {pastor.pastor_name}
                                                </div>
                                                <div className="mt-1 max-w-xl text-sm text-muted-foreground">
                                                    {pastor.address ||
                                                        'No address provided.'}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top text-muted-foreground">
                                                <div>{pastor.section.name}</div>
                                                <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                                                    {pastor.district.name}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top text-muted-foreground">
                                                <div>{pastor.contact_number}</div>
                                                <div className="mt-1">
                                                    {pastor.email ||
                                                        'No email provided.'}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top">
                                                <Badge
                                                    variant={
                                                        pastor.status ===
                                                        'active'
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {pastor.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 align-top">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={PastorController.edit(
                                                                pastor.id,
                                                            )}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            destroy(pastor)
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
