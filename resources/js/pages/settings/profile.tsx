import { Head, Link, usePage } from '@inertiajs/react';
import { Building2, CalendarDays, ShieldAlert, UserRound } from 'lucide-react';
import ActionStatusToast from '@/components/action-status-toast';
import Heading from '@/components/heading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit(),
    },
];

type AccountDetails = {
    role_name: string | null;
    status_label: string | null;
    approval_status_label: string | null;
    position_title: string | null;
    department_name: string | null;
    district_name: string | null;
    section_name: string | null;
    pastor_name: string | null;
    church_name: string | null;
    scope_summary: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type ProfilePageProps = {
    auth: {
        user: {
            name: string;
            email: string;
            email_verified_at: string | null;
        };
    };
    mustVerifyEmail: boolean;
    status?: string;
    account: AccountDetails;
};

export default function Profile({
    mustVerifyEmail,
    status,
    account,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    account: AccountDetails;
}) {
    const { auth } = usePage<ProfilePageProps>().props;

    const accountOverviewItems = [
        {
            label: 'Role',
            value: account.role_name ?? 'No role assigned',
        },
        {
            label: 'Position or title',
            value: account.position_title ?? 'Not assigned',
        },
        {
            label: 'Department',
            value: account.department_name ?? 'General',
        },
        {
            label: 'Approval',
            value: account.approval_status_label ?? 'Not applicable',
        },
    ];

    const scopeItems = [
        {
            label: 'District',
            value: account.district_name ?? 'Not assigned',
        },
        {
            label: 'Section',
            value: account.section_name ?? 'Not assigned',
        },
        {
            label: 'Church',
            value: account.church_name ?? 'Not assigned',
        },
        {
            label: 'Pastor',
            value: account.pastor_name ?? 'Not assigned',
        },
        {
            label: 'Member since',
            value: formatDateTime(account.created_at),
        },
        {
            label: 'Last updated',
            value: formatDateTime(account.updated_at),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Review your system account details, assigned access scope, and administrator-managed profile information."
                    />

                    <div className="space-y-6">
                        <div className="rounded-md border border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(24,77,71,0.08),_rgba(255,255,255,0.96))] px-5 py-5 shadow-sm shadow-[#184d47]/8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold tracking-[0.18em] text-[#184d47] uppercase">
                                        System account
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                                            {account.role_name ??
                                                'No role assigned'}
                                        </h3>
                                        <p className="max-w-2xl text-sm leading-6 text-slate-600">
                                            {account.scope_summary}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <StatusPill
                                        tone="success"
                                        value={
                                            account.status_label ?? 'Unknown'
                                        }
                                    />
                                    {account.approval_status_label && (
                                        <StatusPill
                                            tone={
                                                account.approval_status_label ===
                                                'Approved'
                                                    ? 'success'
                                                    : account.approval_status_label ===
                                                          'Pending'
                                                      ? 'warning'
                                                      : 'neutral'
                                            }
                                            value={
                                                account.approval_status_label
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(24,77,71,0.08),_rgba(255,255,255,0.96))] px-5 py-5 shadow-sm shadow-[#184d47]/8">
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

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900">
                                <UserRound className="size-4 text-[#184d47]" />
                                <h3 className="text-sm font-semibold tracking-[0.18em] uppercase text-[#184d47]">
                                    Account details
                                </h3>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {accountOverviewItems.map((item) => (
                                    <DetailPanel
                                        key={item.label}
                                        label={item.label}
                                        value={item.value}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900">
                                <Building2 className="size-4 text-[#184d47]" />
                                <h3 className="text-sm font-semibold tracking-[0.18em] uppercase text-[#184d47]">
                                    Scope assignment
                                </h3>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {scopeItems.map((item) => (
                                    <DetailPanel
                                        key={item.label}
                                        label={item.label}
                                        value={item.value}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900">
                                <CalendarDays className="size-4 text-[#184d47]" />
                                <h3 className="text-sm font-semibold tracking-[0.18em] uppercase text-[#184d47]">
                                    Identity
                                </h3>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="block w-full"
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
                                        className="block w-full"
                                        value={auth.user.email}
                                        disabled
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <ActionStatusToast
                                    show={status === 'verification-link-sent'}
                                    title="Verification email sent."
                                />
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
                            </div>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

function DetailPanel({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-sidebar-border/70 bg-sidebar/25 px-4 py-4">
            <div className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {label}
            </div>
            <div className="mt-1.5 text-sm font-medium text-slate-900">
                {value}
            </div>
        </div>
    );
}

function StatusPill({
    value,
    tone,
}: {
    value: string;
    tone: 'success' | 'warning' | 'neutral';
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
                tone === 'success' &&
                    'border-emerald-200 bg-emerald-50 text-emerald-800',
                tone === 'warning' &&
                    'border-amber-200 bg-amber-50 text-amber-800',
                tone === 'neutral' &&
                    'border-sidebar-border bg-sidebar/40 text-slate-700',
            )}
        >
            {value}
        </span>
    );
}

function formatDateTime(value: string | null): string {
    if (value === null) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}
