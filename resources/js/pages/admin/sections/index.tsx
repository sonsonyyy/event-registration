import { Head, Link, router, usePage } from '@inertiajs/react';
import SectionController from '@/actions/App/Http/Controllers/Admin/SectionController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
                        className="mb-0"
                    />
                    <Button asChild className="h-11 rounded-xl">
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

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                        <thead className="bg-muted/40">
                            <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                <th className="py-2.5 pr-3 pl-4 font-medium">
                                    Section
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    District
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Pastors
                                </th>
                                <th className="py-2.5 pr-3 font-medium">
                                    Status
                                </th>
                                <th className="py-2.5 pr-4 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border/50">
                            {sections.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-14 text-center"
                                    >
                                        <div className="space-y-2">
                                            <div className="text-base font-medium">
                                                No sections yet.
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Create the first section to group
                                                pastors under a district.
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sections.map((section) => (
                                    <tr
                                        key={section.id}
                                        className="bg-background transition-colors hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3.5 align-middle">
                                            <div className="font-medium text-foreground">
                                                {section.name}
                                            </div>
                                            <div className="mt-1 max-w-xl text-sm text-muted-foreground">
                                                {section.description ||
                                                    'No description provided.'}
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle text-muted-foreground">
                                            {section.district.name}
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle text-muted-foreground">
                                            {section.pastors_count}
                                        </td>
                                        <td className="py-3.5 pr-3 align-middle">
                                            <Badge
                                                variant={
                                                    section.status === 'active'
                                                        ? 'secondary'
                                                        : 'destructive'
                                                }
                                                className="capitalize"
                                            >
                                                {section.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3.5 pr-4 align-middle">
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
                </div>
            </div>
        </AppLayout>
    );
}
