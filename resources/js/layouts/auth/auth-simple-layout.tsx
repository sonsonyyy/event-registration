import { Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import FlashToaster from '@/components/flash-toaster';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    singleCard = false,
    centerContent = false,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div
            className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(193,223,214,0.42),_transparent_34%),linear-gradient(180deg,_#f7f5ef_0%,_#fffdf8_48%,_#f2efe7_100%)] px-4 py-6 sm:px-6 lg:px-8"
            style={{ fontFamily: 'Manrope, sans-serif' }}
        >
            <FlashToaster includeStatus />
            <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl items-center">
                {singleCard ? (
                    <div className="w-full">
                        <div className="overflow-hidden rounded-md border border-[#d5ddd8] bg-white/92 shadow-2xl shadow-[#184d47]/10 backdrop-blur">
                            <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                                <div className="border-b border-[#dbe5df] bg-[linear-gradient(145deg,_rgba(247,252,250,0.96),_rgba(237,245,241,0.9))] p-8 lg:border-r lg:border-b-0 lg:p-10">
                                    <div className="space-y-8">
                                        <Link href={home()} className="inline-flex items-center gap-3 text-slate-900">
                                            <AppLogo />
                                        </Link>

                                        <div className="space-y-4">
                                            <div className="inline-flex rounded-full bg-[#184d47] px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-white uppercase">
                                                Secure access
                                            </div>
                                            <div className="space-y-3">
                                                <h1 className="max-w-xl text-4xl font-extrabold tracking-[-0.04em] text-slate-900">
                                                    {name}
                                                </h1>
                                                <p className="max-w-xl text-base leading-7 text-slate-600">
                                                    Centralized event registration for administrators, reviewers, staff, and authorized registrants across participating districts and departments.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid auto-rows-fr gap-4 sm:grid-cols-3 lg:grid-cols-1">
                                            <div className="flex h-full flex-col justify-center rounded-md border border-white/80 bg-white/80 p-4 shadow-sm shadow-[#184d47]/5">
                                                <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                                    Scoped roles
                                                </div>
                                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                                    Multi-level access across district, section, and church scopes
                                                </div>
                                            </div>

                                            <div className="flex h-full flex-col justify-center rounded-md border border-white/80 bg-white/80 p-4 shadow-sm shadow-[#184d47]/5">
                                                <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                                    Online flow
                                                </div>
                                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                                    Receipt upload with verification tracking
                                                </div>
                                            </div>

                                            <div className="flex h-full flex-col justify-center rounded-md border border-white/80 bg-white/80 p-4 shadow-sm shadow-[#184d47]/5">
                                                <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                                    Onsite entry
                                                </div>
                                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                                    Multi-item transactions in one workflow
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={cn(
                                        'p-6 sm:p-8 lg:p-10',
                                        centerContent && 'flex min-h-full items-center',
                                    )}
                                >
                                    <div className={cn('w-full', centerContent && 'mx-auto max-w-md')}>
                                        <div className="mb-8 space-y-6">
                                            <div className="space-y-2">
                                                <div className="text-xs font-semibold tracking-[0.18em] text-[#184d47] uppercase">
                                                    {name}
                                                </div>
                                                <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
                                                    {title}
                                                </h1>
                                                <p className="text-sm leading-6 text-slate-600">
                                                    {description}
                                                </p>
                                            </div>
                                        </div>

                                        {children}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-center">
                        <div className="hidden rounded-md border border-white/70 bg-[linear-gradient(145deg,_rgba(255,255,255,0.88),_rgba(244,249,247,0.94))] p-8 shadow-2xl shadow-[#184d47]/10 backdrop-blur lg:flex lg:flex-col lg:gap-10">
                            <div className="space-y-8">
                                <Link href={home()} className="inline-flex items-center gap-3 text-slate-900">
                                    <AppLogo />
                                </Link>

                                <div className="space-y-4">
                                    <div className="inline-flex rounded-full bg-[#184d47] px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-white uppercase">
                                        Secure access
                                    </div>
                                    <div className="space-y-3">
                                        <h1 className="max-w-xl text-4xl font-extrabold tracking-[-0.04em] text-slate-900">
                                            {name}
                                        </h1>
                                        <p className="max-w-xl text-base leading-7 text-slate-600">
                                            Centralized event registration for administrators, reviewers, staff, and authorized registrants across participating districts and departments.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid auto-rows-fr gap-4 sm:grid-cols-3">
                                <div className="flex h-full flex-col justify-center rounded-md border border-white/80 bg-white/80 p-4 shadow-sm shadow-[#184d47]/5">
                                    <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                        Scoped roles
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">
                                        Multi-level access across district, section, and church scopes
                                    </div>
                                </div>

                                <div className="flex h-full flex-col justify-center rounded-md border border-white/80 bg-white/80 p-4 shadow-sm shadow-[#184d47]/5">
                                    <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                        Online flow
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">
                                        Receipt upload with verification tracking
                                    </div>
                                </div>

                                <div className="flex h-full flex-col justify-center rounded-md border border-white/80 bg-white/80 p-4 shadow-sm shadow-[#184d47]/5">
                                    <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                        Onsite entry
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">
                                        Multi-item transactions in one workflow
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="w-full rounded-md border border-[#d5ddd8] bg-white/92 p-6 shadow-2xl shadow-[#184d47]/10 backdrop-blur sm:p-8">
                                <div className="mb-8 space-y-6">
                                    <Link href={home()} className="inline-flex items-center gap-3 text-slate-900 lg:hidden">
                                        <AppLogo />
                                    </Link>

                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold tracking-[0.18em] text-[#184d47] uppercase">
                                            {name}
                                        </div>
                                        <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
                                            {title}
                                        </h1>
                                        <p className="text-sm leading-6 text-slate-600">
                                            {description}
                                        </p>
                                    </div>
                                </div>

                                {children}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
