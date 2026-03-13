import { Head, Link, router, usePage } from '@inertiajs/react';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type District = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    sections_count: number;
};

type Props = {
    districts: District[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Districts',
        href: DistrictController.index(),
    },
];

export default function DistrictIndex({ districts }: Props) {
    const page = usePage();
    const flash = page.props.flash as { success?: string | null } | undefined;

    const destroy = (district: District): void => {
        if (! window.confirm(`Delete "${district.name}"? This will also remove its sections and pastors.`)) {
            return;
        }

        router.delete(DistrictController.destroy.url(district.id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Districts" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <Heading
                        title="Districts"
                        description="Manage the top-level district records used to organize sections and pastors."
                    />
                    <Button asChild>
                        <Link href={DistrictController.create()}>
                            New district
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
                        <CardTitle>District directory</CardTitle>
                        <CardDescription>
                            Districts sit at the top of the master-data tree.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-3 pr-4 font-medium">
                                        District
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Sections
                                    </th>
                                    <th className="py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/50">
                                {districts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No districts yet.
                                        </td>
                                    </tr>
                                ) : (
                                    districts.map((district) => (
                                        <tr key={district.id}>
                                            <td className="py-4 pr-4 align-top">
                                                <div className="font-medium">
                                                    {district.name}
                                                </div>
                                                <div className="mt-1 max-w-xl text-sm text-muted-foreground">
                                                    {district.description ||
                                                        'No description provided.'}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top">
                                                <Badge
                                                    variant={
                                                        district.status ===
                                                        'active'
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {district.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 pr-4 align-top text-muted-foreground">
                                                {district.sections_count}
                                            </td>
                                            <td className="py-4 align-top">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={DistrictController.edit(
                                                                district.id,
                                                            )}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            destroy(district)
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
