import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';

export default function Register() {
    return (
        <AuthLayout
            title="Account access is managed by admins"
            description="Contact the admin for system access. Public sign-up is disabled."
        >
            <Head title="Register" />

            <div className="space-y-4 rounded-lg border border-sidebar-border/70 bg-sidebar/30 px-4 py-5 text-sm text-muted-foreground">
                <p>
                    User accounts are created by administrators only. Contact
                    the admin if you need a new account or access changes.
                </p>
                <p>
                    Already have credentials?{' '}
                    <TextLink href={login()}>Return to log in</TextLink>
                </p>
            </div>
        </AuthLayout>
    );
}
