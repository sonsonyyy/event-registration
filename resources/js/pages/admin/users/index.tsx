import { Head, Link, router, usePage } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type UserRecord = {
    id: number;
    name: string;
    email: string;
    status: string;
    role: {
        id: number | null;
        name: string | null;
    };
    district: {
        id: number;
        name: string;
    } | null;
    section: {
        id: number;
        name: string;
        district_name: string | null;
    } | null;
    pastor: {
        id: number;
        pastor_name: string;
        church_name: string;
        section_name: string | null;
        district_name: string | null;
    } | null;
    scope_summary: string;
    can_delete: boolean;
    is_current_user: boolean;
};

type Props = {
    users: UserRecord[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Users',
        href: UserController.index(),
    },
];

export default function UserIndex({ users }: Props) {
    const page = usePage();
    const flash = page.props.flash as
        | {
              success?: string | null;
              error?: string | null;
          }
        | undefined;

    const destroy = (user: UserRecord): void => {
        if (
            ! window.confirm(
                `Delete "${user.name}"? Use inactive status instead if this account still has operational history.`,
            )
        ) {
            return;
        }

        router.delete(UserController.destroy.url(user.id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <Heading
                        title="Users"
                        description="Manage system accounts, roles, and section or pastor scope assignments."
                    />
                    <Button asChild>
                        <Link href={UserController.create()}>
                            New user
                        </Link>
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
                        {flash.error}
                    </div>
                )}

                <Card className="border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle>User directory</CardTitle>
                        <CardDescription>
                            Managers must be section-scoped and online
                            registrants must be pastor-scoped.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-3 pr-4 font-medium">
                                        User
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Role
                                    </th>
                                    <th className="py-3 pr-4 font-medium">
                                        Scope
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
                                {users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No user accounts yet.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="py-4 pr-4 align-top">
                                                <div className="font-medium">
                                                    {user.name}
                                                </div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {user.email}
                                                </div>
                                                {user.is_current_user && (
                                                    <div className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                                                        Current account
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 pr-4 align-top">
                                                <Badge variant="outline">
                                                    {user.role.name ??
                                                        'No role'}
                                                </Badge>
                                            </td>
                                            <td className="py-4 pr-4 align-top text-muted-foreground">
                                                <div>{user.scope_summary}</div>
                                                {user.pastor && (
                                                    <div className="mt-1 text-xs uppercase tracking-wide">
                                                        {
                                                            user.pastor
                                                                .district_name
                                                        }
                                                    </div>
                                                )}
                                                {! user.pastor && user.section && (
                                                    <div className="mt-1 text-xs uppercase tracking-wide">
                                                        {
                                                            user.section
                                                                .district_name
                                                        }
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 pr-4 align-top">
                                                <Badge
                                                    variant={
                                                        user.status === 'active'
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {user.status}
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
                                                            href={UserController.edit(
                                                                user.id,
                                                            )}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    {user.can_delete ? (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                destroy(user)
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled
                                                        >
                                                            Protected
                                                        </Button>
                                                    )}
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
