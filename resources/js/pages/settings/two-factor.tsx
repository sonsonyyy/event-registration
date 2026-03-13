import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editPassword } from '@/routes/user-password';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Password settings',
        href: editPassword(),
    },
];

export default function TwoFactor() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Two-factor authentication" />

            <h1 className="sr-only">Two-factor authentication</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Two-factor authentication"
                        description="Two-factor authentication is hidden and disabled from settings."
                    />

                    <Card className="border-sidebar-border/70">
                        <CardHeader>
                            <CardTitle>Unavailable</CardTitle>
                            <CardDescription>
                                Self-service two-factor authentication is not
                                available from the settings area.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>
                                Two-factor authentication has been hidden from
                                the settings navigation and this page is no
                                longer routed for end users.
                            </p>
                            <p>
                                Use the password settings page for account
                                security updates that are still available.
                            </p>
                            <Link
                                href={editPassword()}
                                className="inline-flex text-sm font-medium text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-neutral-500"
                            >
                                Go to password settings
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
