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
    const backgroundClassName = singleCard
        ? 'bg-[linear-gradient(135deg,_#f8faf9_0%,_#e8f1ee_42%,_#f5f0e7_100%)]'
        : 'bg-[radial-gradient(circle_at_top,_rgba(193,223,214,0.42),_transparent_34%),linear-gradient(180deg,_#f7f5ef_0%,_#fffdf8_48%,_#f2efe7_100%)]';

    return (
        <div
            className={cn(
                'relative isolate min-h-svh overflow-hidden px-4 py-6 sm:px-6 lg:px-8',
                backgroundClassName,
            )}
            style={{ fontFamily: 'Manrope, sans-serif' }}
        >
            {singleCard && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,_rgba(24,77,71,0.18),_transparent_30%),radial-gradient(circle_at_84%_12%,_rgba(14,116,144,0.12),_transparent_26%),linear-gradient(115deg,_rgba(24,77,71,0.12)_0%,_transparent_48%)]" />
                    <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(135deg,_rgba(15,23,42,0.08)_0_1px,_transparent_1px_42px)] [mask-image:linear-gradient(90deg,_black,_transparent_70%)] opacity-40" />
                    <div className="absolute right-0 bottom-0 h-1/2 w-full bg-[linear-gradient(315deg,_rgba(24,77,71,0.11),_transparent_64%)]" />
                </div>
            )}

            <FlashToaster />
            <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-7xl items-center justify-center">
                {singleCard ? (
                    <div
                        className={cn(
                            'w-full min-w-0',
                            centerContent ? 'max-w-md' : 'max-w-2xl',
                        )}
                    >
                        <div className="overflow-hidden rounded-md border border-white/80 bg-white/94 shadow-2xl shadow-[#184d47]/14 backdrop-blur-xl">
                            <div
                                className={cn(
                                    'min-w-0 p-5 sm:p-8 lg:p-10',
                                    centerContent &&
                                        'flex min-h-full items-center',
                                )}
                            >
                                <div className="w-full">
                                    <div className="mb-8 space-y-5 sm:space-y-6">
                                        <div className="min-w-0 space-y-2">
                                            <Link
                                                href={home()}
                                                className="inline-flex max-w-full rounded-md text-xs font-semibold text-[#184d47] uppercase transition-colors hover:text-[#143f3a] focus-visible:ring-2 focus-visible:ring-[#184d47] focus-visible:ring-offset-4 focus-visible:outline-none"
                                            >
                                                {name}
                                            </Link>
                                            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                                                {title}
                                            </h1>
                                            {description && (
                                                <p className="text-sm leading-6 text-slate-600">
                                                    {description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-center">
                        <div className="hidden rounded-md border border-white/70 bg-[linear-gradient(145deg,_rgba(255,255,255,0.88),_rgba(244,249,247,0.94))] p-8 shadow-2xl shadow-[#184d47]/10 backdrop-blur lg:flex lg:flex-col lg:gap-10">
                            <div className="space-y-8">
                                <Link
                                    href={home()}
                                    className="inline-flex items-center gap-3 text-slate-900"
                                >
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
                                            Centralized event registration for
                                            administrators, reviewers, staff,
                                            and authorized registrants across
                                            participating districts and
                                            departments.
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
                                        Multi-level access across district,
                                        section, and church scopes
                                    </div>
                                </div>

                                <div className="flex h-full flex-col justify-center rounded-md border border-white/80 bg-white/80 p-4 shadow-sm shadow-[#184d47]/5">
                                    <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                        Online flow
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-slate-900">
                                        Receipt upload with verification
                                        tracking
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
                            <div className="w-full min-w-0 rounded-md border border-[#d5ddd8] bg-white/92 p-5 shadow-2xl shadow-[#184d47]/10 backdrop-blur sm:p-8">
                                <div className="mb-8 space-y-6">
                                    <Link
                                        href={home()}
                                        className="inline-flex items-center gap-3 text-slate-900 lg:hidden"
                                    >
                                        <AppLogo />
                                    </Link>

                                    <div className="min-w-0 space-y-2">
                                        <div className="text-xs font-semibold tracking-[0.18em] text-[#184d47] uppercase">
                                            {name}
                                        </div>
                                        <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-900 sm:text-3xl">
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
