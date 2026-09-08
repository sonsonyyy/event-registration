import { Head, Link, usePage, usePoll } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CircleCheckBig,
    Clock3,
    LogIn,
    MapPin,
    Ticket,
    UsersRound,
} from 'lucide-react';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import RegistrantAccessController from '@/actions/App/Http/Controllers/RegistrantAccessController';
import AppLogo from '@/components/app-logo';
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

const formatEventDateBadge = (
    value: string,
): {
    month: string;
    day: string;
} => {
    const parts = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Manila',
    }).formatToParts(new Date(value));

    return {
        month:
            parts.find((part) => part.type === 'month')?.value.toUpperCase() ??
            '',
        day: parts.find((part) => part.type === 'day')?.value ?? '',
    };
};

const eventDatesAreSameDay = (dateFrom: string, dateTo: string): boolean => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'Asia/Manila',
        year: 'numeric',
    });

    return (
        formatter.format(new Date(dateFrom)) ===
        formatter.format(new Date(dateTo))
    );
};

const formatPublicEventDate = (dateFrom: string, dateTo: string): string =>
    eventDatesAreSameDay(dateFrom, dateTo)
        ? new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeZone: 'Asia/Manila',
          }).format(new Date(dateFrom))
        : formatSystemDateRange(dateFrom, dateTo);

function PublicEventCard({
    event,
    primaryActionHref,
    primaryActionLabel,
    className = '',
}: {
    event: EventRecord;
    primaryActionHref: PrimaryActionHref;
    primaryActionLabel: string;
    className?: string;
}) {
    const dateBadge = formatEventDateBadge(event.date_from);
    const reservedSlots = Math.max(
        event.total_capacity - event.remaining_slots,
        0,
    );
    const capacityPercentage =
        event.total_capacity > 0
            ? Math.min((reservedSlots / event.total_capacity) * 100, 100)
            : 0;

    return (
        <Card
            className={`group flex h-full w-full flex-col overflow-hidden border-[#d8ddd2] bg-white/95 py-0 shadow-sm ring-1 ring-black/[0.03] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#b8c8be] hover:shadow-xl hover:shadow-[#184d47]/8 ${className}`}
        >
            <CardContent className="flex h-full flex-1 flex-col p-0">
                <div className="flex flex-1 flex-col">
                    <div className="flex items-start gap-4 border-b border-[#edf1ea] bg-[linear-gradient(135deg,_rgba(24,77,71,0.08),_rgba(255,255,255,0.92))] px-5 py-5">
                        <div className="flex w-16 shrink-0 flex-col self-start overflow-hidden rounded-md border border-[#d7e1d8] bg-white text-center shadow-sm">
                            <div className="bg-[#184d47] px-2 py-1 text-[0.65rem] font-bold tracking-[0.16em] text-white uppercase">
                                {dateBadge.month}
                            </div>
                            <div className="px-2 py-2 text-2xl leading-none font-extrabold text-slate-900">
                                {dateBadge.day}
                            </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                            <h3 className="min-w-0 text-lg font-bold text-slate-900">
                                {event.name}
                            </h3>
                            <p className="line-clamp-2 text-xs leading-6 text-slate-600">
                                {event.description}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 px-5 py-4 text-sm text-slate-600">
                        <div className="flex min-w-0 items-start gap-2.5">
                            <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#184d47]" />
                            <span className="font-medium text-slate-800">
                                {formatPublicEventDate(
                                    event.date_from,
                                    event.date_to,
                                )}
                            </span>
                        </div>

                        <div className="flex min-w-0 items-start gap-2.5">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-[#184d47]" />
                            <span className="line-clamp-1 font-medium text-slate-800">
                                {event.venue}
                            </span>
                        </div>

                        <div className="flex min-w-0 items-start gap-2.5">
                            <Clock3 className="mt-0.5 size-4 shrink-0 text-[#184d47]" />
                            <div className="min-w-0">
                                <div>Registration closes</div>
                                <div className="font-semibold text-slate-800">
                                    {formatSystemDateTime(
                                        event.registration_close_at,
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[#edf1ea] px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                                <Ticket className="size-3.5 text-[#184d47]" />
                                Fees
                            </div>
                            <div className="text-xs font-semibold text-[#184d47]">
                                {event.remaining_slots} of{' '}
                                {event.total_capacity} slots left
                            </div>
                        </div>

                        <div className="mt-3 max-h-36 overflow-y-auto rounded-md border border-[#e8ece5] bg-[#fbfcfa]">
                            {event.fee_categories.map((feeCategory) => (
                                <div
                                    key={feeCategory.id}
                                    className="flex items-center justify-between gap-3 border-b border-[#eef2ea] px-3 py-2.5 last:border-b-0"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-slate-900">
                                            {feeCategory.category_name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {feeCategory.remaining_slots ===
                                            null
                                                ? 'No category slot limit'
                                                : `${feeCategory.remaining_slots} category slots left`}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-sm font-extrabold text-[#184d47]">
                                        {formatCurrency(feeCategory.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto border-t border-[#edf1ea] px-5 py-4">
                        <div className="mb-3 flex items-center gap-2">
                            <UsersRound className="size-4 text-slate-500" />
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-[#184d47]"
                                    style={{ width: `${capacityPercentage}%` }}
                                />
                            </div>
                            <span className="text-xs font-semibold text-slate-500">
                                {reservedSlots} registered
                            </span>
                        </div>

                        <Button
                            asChild
                            className="h-10 w-full rounded-md px-4 text-sm"
                        >
                            <Link
                                href={primaryActionHref}
                                className="justify-center"
                            >
                                {primaryActionLabel}
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function PublicEventsGrid({
    events,
    primaryActionHref,
    primaryActionLabel,
}: {
    events: EventRecord[];
    primaryActionHref: PrimaryActionHref;
    primaryActionLabel: string;
}) {
    return (
        <div className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
                <PublicEventCard
                    key={event.id}
                    event={event}
                    primaryActionHref={primaryActionHref}
                    primaryActionLabel={primaryActionLabel}
                />
            ))}
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
                                        Browse open district and department
                                        events, choose the right fee categories
                                        for your church, upload payment proof,
                                        and track each submission from review to
                                        verified registration.
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
                            ) : (
                                <PublicEventsGrid
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
