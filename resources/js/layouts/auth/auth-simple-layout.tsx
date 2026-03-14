import { Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div
            className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(193,223,214,0.42),_transparent_34%),linear-gradient(180deg,_#f7f5ef_0%,_#fffdf8_48%,_#f2efe7_100%)] px-4 py-6 sm:px-6 lg:px-8"
            style={{ fontFamily: 'Manrope, sans-serif' }}
        >
            <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-6xl items-center">
                <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-start">
                    <div className="hidden self-start rounded-[32px] border border-white/70 bg-[linear-gradient(145deg,_rgba(255,255,255,0.88),_rgba(244,249,247,0.94))] p-8 shadow-2xl shadow-[#184d47]/10 backdrop-blur lg:flex lg:flex-col lg:gap-10">
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
                                        Centralized event registration for district administrators, managers, staff, and authorized church registrants.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm shadow-[#184d47]/5">
                                <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                    Scoped roles
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                    District, section, and church-aware access
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm shadow-[#184d47]/5">
                                <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                    Online flow
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                    Receipt upload with verification tracking
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm shadow-[#184d47]/5">
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
                        <div className="w-full rounded-[32px] border border-[#d5ddd8] bg-white/92 p-6 shadow-2xl shadow-[#184d47]/10 backdrop-blur sm:p-8">
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
            </div>
        </div>
    );
}
