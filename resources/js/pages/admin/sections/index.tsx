import { Head, Link, router, usePage } from '@inertiajs/react';
import SectionController from '@/actions/App/Http/Controllers/Admin/SectionController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Section = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    pastors_count: number;
    district: {
        id: number;
        name: string;
    };
};

type Props = {
    sections: Section[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Sections',
        href: SectionController.index(),
    },
];

export default function SectionIndex({ sections }: Props) {
    const page = usePage();
    const flash = page.props.flash as { success?: string | null } | undefined;

    const destroy = (section: Section): void => {
        if (! window.confirm(`Delete "${section.name}"? This will also remove its pastors.`)) {
            return;
        }

        router.delete(SectionController.destroy.url(section.id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sections" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <Heading
                        title="Sections"
                        description="Create and maintain the section records that sit beneath each district."
                    />
                    <Button asChild>
                        <Link href={SectionController.create()}>
                            New section
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
                        <CardTitle>Section directory</CardTitle>
                        <CardDescription>
                            Sections organize the pastors and churches inside a
                            district.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-3 pr-4 font-medium">
                                        Section
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        District
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Pastors
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
                                {sections.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No sections yet.
                                        </td>
                                    </tr>
                                ) : (
                                    sections.map((section) => (
                                        <tr key={section.id}>
                                            <td className="py-4 pr-4 align-top">
                                                <div className="font-medium">
                                                    {section.name}
                                                </div>
                                                <div className="mt-1 max-w-xl text-sm text-muted-foreground">
                                                    {section.description ||
                                                        'No description provided.'}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 align-top text-muted-foreground">
                                                {section.district.name}
                                            </td>
                                            <td className="py-4 pr-4 align-top text-muted-foreground">
                                                {section.pastors_count}
                                            </td>
                                            <td className="py-4 pr-4 align-top">
                                                <Badge
                                                    variant={
                                                        section.status ===
                                                        'active'
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {section.status}
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
                                                            href={SectionController.edit(
                                                                section.id,
                                                            )}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            destroy(section)
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
