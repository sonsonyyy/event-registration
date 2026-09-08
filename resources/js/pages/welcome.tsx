import { Head, Link, usePage, usePoll } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    CircleCheckBig,
    LogIn,
    MapPin,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import RegistrantAccessController from '@/actions/App/Http/Controllers/RegistrantAccessController';
import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatSystemDateRange, formatSystemDateTime } from '@/lib/date-time';
import { dashboard, login } from '@/routes';

type FeeCategoryRecord = {
    id: number;
    category_name: string;
    amount: string;
    remaining_slots: number | null;
};

type EventRecord = {
    id: number;
    name: string;
    description: string;
    venue: string;
    date_from: string;
    date_to: string;
    registration_close_at: string;
    total_capacity: number;
    remaining_slots: number;
    fee_categories: FeeCategoryRecord[];
};

type PageProps = {
    auth: {
        user: { id: number; name: string } | null;
        can: {
            manageOnlineRegistrations: boolean;
        };
    };
    events: EventRecord[];
    registrationFlow: Array<{
        eyebrow: string;
        title: string;
        description: string;
    }>;
    faqs: Array<{
        question: string;
        answer: string;
    }>;
};

type PrimaryActionHref =
    | ReturnType<typeof login>
    | ReturnType<typeof dashboard>
    | ReturnType<typeof OnlineRegistrationController.create>;

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

function PublicEventCard({
    event,
    primaryActionHref,
    primaryActionLabel,
    className = '',
    hoverable = false,
}: {
    event: EventRecord;
    primaryActionHref: PrimaryActionHref;
    primaryActionLabel: string;
    className?: string;
    hoverable?: boolean;
}) {
    return (
        <Card
            className={`flex h-full w-full flex-col overflow-hidden border-[#d8ddd2] bg-white/90 py-0 shadow-xl shadow-[#184d47]/5 ${hoverable ? 'transition-transform duration-300 group-hover:scale-[1.015]' : ''} ${className}`}
        >
            <CardContent className="flex h-full flex-1 flex-col p-0">
                <div className="border-b border-[#edf1ea] bg-[linear-gradient(135deg,_rgba(24,77,71,0.08),_rgba(255,255,255,0.9))] px-6 py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
                                {event.name}
                            </h3>
                            <p className="max-w-2xl text-sm leading-6 text-slate-600">
                                {event.description}
                            </p>
                        </div>
                        <Badge className="rounded-md bg-[#184d47] px-3 py-1 text-white hover:bg-[#184d47]">
                            {event.remaining_slots} slots left
                        </Badge>
                    </div>
                </div>

                <div className="flex flex-1 flex-col gap-5 px-6 py-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-md border border-[#e8ece5] bg-[#fafbf8] px-4 py-4">
                            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                <CalendarDays className="size-4 text-[#184d47]" />
                                Event dates
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">
                                {formatSystemDateRange(
                                    event.date_from,
                                    event.date_to,
                                )}
                            </div>
                        </div>

                        <div className="rounded-md border border-[#e8ece5] bg-[#fafbf8] px-4 py-4">
                            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                <MapPin className="size-4 text-[#184d47]" />
                                Venue
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">
                                {event.venue}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col rounded-md border border-[#e8ece5] bg-[#fafbf8] px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                Fee categories
                            </div>
                            <div className="text-xs text-slate-500">
                                Registration closes{' '}
                                {formatSystemDateTime(
                                    event.registration_close_at,
                                )}
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                            {event.fee_categories.map((feeCategory) => (
                                <div
                                    key={feeCategory.id}
                                    className="flex flex-col gap-2 rounded-md border border-white bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <div className="font-semibold text-slate-900">
                                            {feeCategory.category_name}
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {feeCategory.remaining_slots ===
                                            null
                                                ? 'No category slot limit'
                                                : `${feeCategory.remaining_slots} category slots left`}
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold tracking-[-0.03em] text-[#184d47]">
                                        {formatCurrency(feeCategory.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-slate-500">
                            Total event capacity:{' '}
                            <span className="font-semibold text-slate-900">
                                {event.total_capacity}
                            </span>
                        </div>
                        <Button asChild className="h-11 rounded-md px-5">
                            <Link href={primaryActionHref}>
                                {primaryActionLabel}
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function PublicEventsCarousel({
    events,
    primaryActionHref,
    primaryActionLabel,
}: {
    events: EventRecord[];
    primaryActionHref: PrimaryActionHref;
    primaryActionLabel: string;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoAdvancePaused, setIsAutoAdvancePaused] = useState(false);

    useEffect(() => {
        const container = containerRef.current;

        if (container === null) {
            return;
        }

        const updateActiveIndex = (): void => {
            const slides = Array.from(
                container.querySelectorAll<HTMLElement>(
                    '[data-event-slide-index]',
                ),
            );

            if (slides.length === 0) {
                setActiveIndex(0);

                return;
            }

            const containerCenter =
                container.scrollLeft + container.clientWidth / 2;

            const currentIndex = slides.reduce((closestIndex, slide, index) => {
                const closestSlide = slides[closestIndex];
                const currentDistance = Math.abs(
                    slide.offsetLeft + slide.clientWidth / 2 - containerCenter,
                );
                const closestDistance = Math.abs(
                    closestSlide.offsetLeft +
                        closestSlide.clientWidth / 2 -
                        containerCenter,
                );

                return currentDistance < closestDistance ? index : closestIndex;
            }, 0);

            setActiveIndex(currentIndex);
        };

        updateActiveIndex();

        container.addEventListener('scroll', updateActiveIndex, {
            passive: true,
        });
        window.addEventListener('resize', updateActiveIndex);

        return () => {
            container.removeEventListener('scroll', updateActiveIndex);
            window.removeEventListener('resize', updateActiveIndex);
        };
    }, [events.length]);

    const scrollToIndex = (index: number): void => {
        const container = containerRef.current;

        if (container === null) {
            return;
        }

        const targetSlide = container.querySelector<HTMLElement>(
            `[data-event-slide-index="${index}"]`,
        );

        if (targetSlide === null) {
            return;
        }

        container.scrollTo({
            left:
                targetSlide.offsetLeft -
                Math.max(
                    (container.clientWidth - targetSlide.clientWidth) / 2,
                    0,
                ),
            behavior: 'smooth',
        });
    };

    const goToPrevious = (): void => {
        scrollToIndex(Math.max(activeIndex - 1, 0));
    };

    const goToNext = (): void => {
        scrollToIndex(Math.min(activeIndex + 1, events.length - 1));
    };

    useEffect(() => {
        if (events.length <= 1 || isAutoAdvancePaused) {
            return;
        }

        const timeout = window.setTimeout(() => {
            scrollToIndex(
                activeIndex === events.length - 1 ? 0 : activeIndex + 1,
            );
        }, 3000);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [activeIndex, events.length, isAutoAdvancePaused]);

    return (
        <div className="mx-auto w-full max-w-6xl space-y-5">
            <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                <div className="hidden md:flex md:justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        className="size-11 rounded-md border-[#d8ddd2] bg-white/95 p-0 shadow-sm"
                        onClick={goToPrevious}
                        disabled={activeIndex === 0}
                        aria-label="Previous event"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                </div>

                <div
                    ref={containerRef}
                    className="flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto px-[6%] pb-2 [scrollbar-width:none] md:px-[8%] xl:px-[11%] [&::-webkit-scrollbar]:hidden"
                >
                    {events.map((event, index) => (
                        <div
                            key={event.id}
                            data-event-slide-index={index}
                            className="group flex w-[88%] shrink-0 snap-center md:w-[84%] xl:w-[78%]"
                            onMouseEnter={() => setIsAutoAdvancePaused(true)}
                            onMouseLeave={() => setIsAutoAdvancePaused(false)}
                        >
                            <PublicEventCard
                                event={event}
                                primaryActionHref={primaryActionHref}
                                primaryActionLabel={primaryActionLabel}
                                hoverable
                            />
                        </div>
                    ))}
                </div>

                <div className="hidden md:flex md:justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        className="size-11 rounded-md border-[#d8ddd2] bg-white/95 p-0 shadow-sm"
                        onClick={goToNext}
                        disabled={activeIndex === events.length - 1}
                        aria-label="Next event"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="flex justify-center gap-2">
                {events.map((event, index) => (
                    <button
                        key={event.id}
                        type="button"
                        onClick={() => scrollToIndex(index)}
                        aria-label={`Go to event ${index + 1}`}
                        className={`h-2.5 rounded-full transition-all ${
                            index === activeIndex
                                ? 'w-8 bg-[#184d47]'
                                : 'w-2.5 bg-[#c8d5d0] hover:bg-[#9bb8af]'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

export default function Welcome() {
    const { auth, events, registrationFlow, faqs } = usePage<PageProps>().props;

    usePoll(20000, {
        only: ['events'],
    });

    const currentYear = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        timeZone: 'Asia/Manila',
    }).format(new Date());
    const primaryActionHref = auth.user
        ? auth.can.manageOnlineRegistrations
            ? OnlineRegistrationController.create()
            : dashboard()
        : login();
    const primaryActionLabel = auth.user
        ? auth.can.manageOnlineRegistrations
            ? 'Register now'
            : 'Open dashboard'
        : 'Register now';

    return (
        <>
            <Head title="Church Event Registration">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=manrope:400,500,600,700,800"
                    rel="stylesheet"
                />
            </Head>

            <div
                className="min-h-screen bg-[radial-gradient(circle_at_18%_18%,_rgba(24,77,71,0.18),_transparent_30%),radial-gradient(circle_at_84%_12%,_rgba(14,116,144,0.12),_transparent_26%),linear-gradient(315deg,_rgba(24,77,71,0.11),_transparent_64%),linear-gradient(135deg,_#f8faf9_0%,_#e8f1ee_42%,_#f5f0e7_100%)] text-slate-900"
                style={{ fontFamily: 'Manrope, sans-serif' }}
            >
                <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 text-[0.9375rem] sm:px-6 sm:text-base lg:px-8">
                    <header className="grid gap-3 py-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
                        <div className="flex items-center justify-center md:justify-start">
                            <AppLogo />
                        </div>

                        <nav className="hidden items-center justify-center gap-6 md:flex">
                            <a
                                href="#available-events"
                                className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                            >
                                Events
                            </a>
                            <a
                                href="#how-to-register"
                                className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                            >
                                How to Register
                            </a>
                            <a
                                href="#faqs"
                                className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                            >
                                FAQs
                            </a>
                        </nav>

                        <div className="flex max-w-full flex-wrap items-center justify-center gap-2 sm:gap-3 md:justify-end">
                            <Link
                                href={RegistrantAccessController.create()}
                                className="inline-flex max-w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900 sm:px-3 sm:text-sm"
                            >
                                <span className="sm:hidden">
                                    Request Access
                                </span>
                                <span className="hidden sm:inline">
                                    Request Church Access
                                </span>
                            </Link>
                            {auth.user ? (
                                <Button
                                    asChild
                                    className="h-10 rounded-md px-4 text-xs sm:px-5 sm:text-sm"
                                >
                                    <Link href={dashboard()}>Dashboard</Link>
                                </Button>
                            ) : (
                                <Link
                                    href={login()}
                                    className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900 sm:px-3 sm:text-sm"
                                >
                                    <LogIn className="size-4" />
                                    Log in
                                </Link>
                            )}
                        </div>
                    </header>

                    <main className="flex flex-1 flex-col gap-10 pt-8 pb-12 lg:gap-16 lg:pt-16">
                        <section className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
                            <div className="flex w-full flex-col items-center gap-8">
                                <div className="space-y-4">
                                    <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
                                        Register for CLD Events
                                    </h1>
                                    <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg">
                                        Browse open district and department events,
                                        choose the right fee categories for your church,
                                        upload payment proof, and track each submission from
                                        review to verified registration.
                                    </p>
                                </div>

                                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-11 rounded-md px-5 text-sm sm:h-12 sm:px-6"
                                    >
                                        <Link href={primaryActionHref}>
                                            {primaryActionLabel}
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        asChild
                                        size="lg"
                                        className="h-11 rounded-md px-5 text-sm sm:h-12 sm:px-6"
                                    >
                                        <a href="#available-events">
                                            Browse available events
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </section>

                        <section
                            id="available-events"
                            className="mx-auto flex w-full max-w-6xl flex-col items-center space-y-6"
                        >
                            <div className="space-y-2 text-center">
                                <p className="text-sm font-semibold tracking-[0.2em] text-[#184d47] uppercase">
                                    Available events
                                </p>
                                <h2 className="text-3xl font-bold tracking-[-0.04em]">
                                    Open registrations
                                </h2>
                                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                                    Events shown here are open, within their
                                    registration window, and still have capacity
                                    available.
                                </p>
                            </div>

                            {events.length === 0 ? (
                                <Card className="border-dashed border-[#cad4c4] bg-white/70 py-8 shadow-sm">
                                    <CardContent className="space-y-2 px-6 text-center">
                                        <div className="text-lg font-semibold">
                                            No events are currently open.
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Check back once the next event is
                                            published for registration.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : events.length === 1 ? (
                                <div className="mx-auto w-full max-w-3xl">
                                    <PublicEventCard
                                        event={events[0]}
                                        primaryActionHref={primaryActionHref}
                                        primaryActionLabel={primaryActionLabel}
                                    />
                                </div>
                            ) : (
                                <PublicEventsCarousel
                                    events={events}
                                    primaryActionHref={primaryActionHref}
                                    primaryActionLabel={primaryActionLabel}
                                />
                            )}
                        </section>

                        <section
                            id="how-to-register"
                            className="mx-auto flex w-full max-w-6xl flex-col items-center space-y-6"
                        >
                            <div className="space-y-2 text-center">
                                <p className="text-sm font-semibold tracking-[0.2em] text-[#184d47] uppercase">
                                    How to register
                                </p>
                                <h2 className="text-3xl font-bold tracking-[-0.04em]">
                                    Registration flow
                                </h2>
                                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                                    Follow the church registration process from
                                    account request through final verification.
                                </p>
                            </div>

                            <div className="grid w-full gap-4 md:grid-cols-3">
                                {registrationFlow.map((step, index) => (
                                    <Card
                                        key={step.eyebrow}
                                        className="relative overflow-hidden border-[#d8ddd2] bg-white/95 py-0 shadow-xl shadow-[#184d47]/6"
                                    >
                                        <div className="absolute inset-x-0 top-0 h-1 bg-[#184d47]" />
                                        <CardContent className="flex h-full flex-col gap-5 px-6 py-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[#184d47] text-lg font-bold text-white shadow-lg shadow-[#184d47]/20">
                                                    {index + 1}
                                                </div>
                                                <div className="flex size-9 items-center justify-center rounded-md border border-[#dbe4df] bg-[#f3f7f4] text-[#184d47]">
                                                    <CircleCheckBig className="size-4" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="text-xs font-semibold tracking-[0.18em] text-[#184d47] uppercase">
                                                    {step.eyebrow}
                                                </div>
                                                <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">
                                                    {step.title}
                                                </h3>
                                                <p className="text-sm leading-6 text-slate-600">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        <section
                            id="faqs"
                            className="mx-auto flex w-full max-w-6xl flex-col items-center space-y-6"
                        >
                            <div className="space-y-2 text-center">
                                <p className="text-sm font-semibold tracking-[0.2em] text-[#184d47] uppercase">
                                    Registration guide
                                </p>
                                <h2 className="text-3xl font-bold tracking-[-0.04em]">
                                    Frequently asked questions
                                </h2>
                                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                                    A quick guide for registrant accounts and
                                    online event submissions.
                                </p>
                            </div>

                            <div className="grid w-full gap-4 lg:grid-cols-2">
                                {faqs.map((faq, index) => (
                                    <Card
                                        key={faq.question}
                                        className={`border-[#d8ddd2] bg-white/90 py-0 shadow-xl shadow-[#184d47]/5 ${index === 0 ? 'lg:col-span-2' : ''}`}
                                    >
                                        <CardContent className="space-y-3 px-6 py-6">
                                            <div className="text-xs font-semibold tracking-[0.18em] text-[#184d47] uppercase">
                                                FAQ {index + 1}
                                            </div>
                                            <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">
                                                {faq.question}
                                            </h3>
                                            <p className="text-sm leading-7 text-slate-600">
                                                {faq.answer}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    </main>

                    <footer className="mt-4 border-t border-[#d8ddd2] pt-8 pb-4">
                        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]">
                            <div className="space-y-3">
                                <div className="text-sm font-semibold tracking-[0.18em] text-[#184d47] uppercase">
                                    Event Registration Platform
                                </div>
                                <p className="max-w-xl text-sm leading-6 text-slate-600">
                                    Centralized event registration for church
                                    representatives, reviewers, and onsite event
                                    staff across participating districts and
                                    departments.
                                </p>
                                <p className="text-xs tracking-[0.14em] text-slate-500 uppercase">
                                    © {currentYear} Event Registration Platform
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm font-semibold tracking-[0.18em] text-[#184d47] uppercase">
                                    Quick links
                                </div>
                                <div className="flex flex-col gap-2 text-sm text-slate-600">
                                    <a
                                        href="#available-events"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        Events
                                    </a>
                                    <a
                                        href="#how-to-register"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        How to Register
                                    </a>
                                    <a
                                        href="#faqs"
                                        className="transition-colors hover:text-slate-900"
                                    >
                                        FAQs
                                    </a>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm font-semibold tracking-[0.18em] text-[#184d47] uppercase">
                                    Need access?
                                </div>
                                <p className="text-sm leading-6 text-slate-600">
                                    Coordinate with your assigned administrators
                                    for account approval and registration
                                    support.
                                </p>
                                <Link
                                    href={RegistrantAccessController.create()}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#184d47] transition-colors hover:text-slate-900"
                                >
                                    Request church access
                                </Link>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
