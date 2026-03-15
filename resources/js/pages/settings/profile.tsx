import { Transition } from '@headlessui/react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import Heading from '@/components/heading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit(),
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Your name and email are managed by administrators."
                    />

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(24,77,71,0.08),_rgba(255,255,255,0.96))] px-5 py-5 shadow-sm shadow-[#184d47]/8">
                            <div className="flex items-start gap-4">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#184d47] text-white shadow-sm shadow-[#184d47]/20">
                                    <ShieldAlert className="size-4" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="text-xs font-semibold tracking-[0.18em] text-[#184d47] uppercase">
                                        Administrator managed
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Profile changes are locked on this page.
                                    </p>
                                    <p className="text-sm leading-6 text-slate-600">
                                        Contact an administrator if you need to
                                        update your name, email address, or any
                                        other account details.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={auth.user.name}
                                disabled
                                readOnly
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={auth.user.email}
                                disabled
                                readOnly
                            />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="-mt-1 text-sm text-muted-foreground">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={send()}
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Click here to resend the verification
                                        email.
                                    </Link>
                                </p>

                                <Transition
                                    show={status === 'verification-link-sent'}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to
                                        your email address.
                                    </div>
                                </Transition>
                            </div>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
