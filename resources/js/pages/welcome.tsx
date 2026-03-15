import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ClipboardList,
    LogIn,
    MapPin,
    ReceiptText,
    ShieldCheck,
    Upload,
    UsersRound,
} from 'lucide-react';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    formatSystemDateRange,
    formatSystemDateTime,
} from '@/lib/date-time';
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
    faqs: Array<{
        question: string;
        answer: string;
    }>;
};

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

export default function Welcome() {
    const { auth, events, faqs } = usePage<PageProps>().props;
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
                className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(193,223,214,0.45),_transparent_34%),linear-gradient(180deg,_#f7f5ef_0%,_#fffdf8_48%,_#f2efe7_100%)] text-slate-900"
                style={{ fontFamily: 'Manrope, sans-serif' }}
            >
                <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
                    <header className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <AppLogo />
                        </div>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Button asChild className="h-10 rounded-xl px-5">
                                    <Link href={dashboard()}>Dashboard</Link>
                                </Button>
                            ) : (
                                <Link
                                    href={login()}
                                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900"
                                >
                                    <LogIn className="size-4" />
                                    Log in
                                </Link>
                            )}
                        </div>
                    </header>

                    <main className="flex flex-1 flex-col gap-12 pt-10 pb-12 lg:gap-16 lg:pt-16">
                        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
                            <div className="max-w-3xl space-y-8">
                                <div className="space-y-5">
                                    <Badge className="rounded-full bg-[#184d47] px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-white uppercase hover:bg-[#184d47]">
                                        Central Luzon District Event Registration
                                    </Badge>

                                    <div className="space-y-4">
                                        <h1 className="max-w-3xl text-4xl font-extrabold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
                                            Professional event registration for church-wide gatherings.
                                        </h1>
                                        <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                                            View open events, monitor remaining slots, and submit grouped online registrations by church with receipt upload and verification tracking.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button asChild size="lg" className="h-12 rounded-xl bg-[#184d47] px-6 text-white hover:bg-[#143f3a]">
                                        <Link href={primaryActionHref}>
                                            {primaryActionLabel}
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild size="lg" className="h-12 rounded-xl px-6">
                                        <a href="#available-events">Browse available events</a>
                                    </Button>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Card className="border-white/70 bg-white/75 py-5 shadow-lg shadow-[#184d47]/5 backdrop-blur">
                                        <CardContent className="space-y-2 px-5">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <CalendarDays className="size-4 text-[#184d47]" />
                                                Open events
                                            </div>
                                            <div className="text-3xl font-extrabold tracking-[-0.04em]">
                                                {events.length}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-white/70 bg-white/75 py-5 shadow-lg shadow-[#184d47]/5 backdrop-blur">
                                        <CardContent className="space-y-2 px-5">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <UsersRound className="size-4 text-[#184d47]" />
                                                Live capacity
                                            </div>
                                            <div className="text-3xl font-extrabold tracking-[-0.04em]">
                                                {events.reduce((carry, event) => carry + event.remaining_slots, 0)}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-white/70 bg-white/75 py-5 shadow-lg shadow-[#184d47]/5 backdrop-blur">
                                        <CardContent className="space-y-2 px-5">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <ShieldCheck className="size-4 text-[#184d47]" />
                                                Online flow
                                            </div>
                                            <div className="text-sm leading-6 text-slate-600">
                                                Receipt upload and verification-ready submissions
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <Card className="overflow-hidden border-[#d7ddd2] bg-[#123630] py-0 text-white shadow-2xl shadow-[#123630]/20">
                                <CardContent className="p-0">
                                    <div className="border-b border-white/10 px-6 py-5">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-[#b6d6cd]">
                                            <ReceiptText className="size-4" />
                                            Registrant access
                                        </div>
                                        <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em]">
                                            Church-based online registration
                                        </h2>
                                    </div>

                                    <div className="space-y-4 px-6 py-6 text-sm leading-6 text-[#d3e5df]">
                                        <p>
                                            Online registration is available only to authorized registrant accounts assigned to a church or pastor record.
                                        </p>
                                        <ul className="space-y-3">
                                            <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#b6d6cd]">
                                                    <ClipboardList className="size-4" />
                                                </div>
                                                <div>
                                                    Select an open event and add multiple fee-category quantities in one transaction.
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#b6d6cd]">
                                                    <Upload className="size-4" />
                                                </div>
                                                <div>
                                                    Upload proof of payment in JPG, PNG, or PDF format during submission.
                                                </div>
                                            </li>
                                            <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#b6d6cd]">
                                                    <ShieldCheck className="size-4" />
                                                </div>
                                                <div>
                                                    Track pending verification, verified, and rejected registrations from your history page.
                                                </div>
                                            </li>
                                        </ul>
                                        <div className="rounded-2xl border border-[#3c655e] bg-[#184d47] px-4 py-4 text-[#eff8f5]">
                                            Use your assigned registrant account to continue. Guests are redirected to the login page before they can register.
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        <section id="available-events" className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm font-semibold tracking-[0.2em] text-[#184d47] uppercase">
                                    Available events
                                </p>
                                <h2 className="text-3xl font-bold tracking-[-0.04em]">
                                    Open registrations
                                </h2>
                                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                                    Events shown here are open, within their registration window, and still have capacity available.
                                </p>
                            </div>

                            {events.length === 0 ? (
                                <Card className="border-dashed border-[#cad4c4] bg-white/70 py-8 shadow-sm">
                                    <CardContent className="space-y-2 px-6 text-center">
                                        <div className="text-lg font-semibold">
                                            No events are currently open.
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Check back once the next district event is published for registration.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {events.map((event) => (
                                        <Card
                                            key={event.id}
                                            className="overflow-hidden border-[#d8ddd2] bg-white/90 py-0 shadow-xl shadow-[#184d47]/5"
                                        >
                                            <CardContent className="p-0">
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
                                                        <Badge className="rounded-xl bg-[#184d47] px-3 py-1 text-white hover:bg-[#184d47]">
                                                            {event.remaining_slots} slots left
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="space-y-5 px-6 py-6">
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <div className="rounded-2xl border border-[#e8ece5] bg-[#fafbf8] px-4 py-4">
                                                            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                                                <CalendarDays className="size-4 text-[#184d47]" />
                                                                Event dates
                                                            </div>
                                                            <div className="mt-2 text-sm font-semibold text-slate-900">
                                                                {formatSystemDateRange(event.date_from, event.date_to)}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-2xl border border-[#e8ece5] bg-[#fafbf8] px-4 py-4">
                                                            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                                                <MapPin className="size-4 text-[#184d47]" />
                                                                Venue
                                                            </div>
                                                            <div className="mt-2 text-sm font-semibold text-slate-900">
                                                                {event.venue}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-2xl border border-[#e8ece5] bg-[#fafbf8] px-4 py-4">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                                                Fee categories
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                Registration closes {formatSystemDateTime(event.registration_close_at)}
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 grid gap-3">
                                                            {event.fee_categories.map((feeCategory) => (
                                                                <div
                                                                    key={feeCategory.id}
                                                                    className="flex flex-col gap-2 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                                                >
                                                                    <div>
                                                                        <div className="font-semibold text-slate-900">
                                                                            {feeCategory.category_name}
                                                                        </div>
                                                                        <div className="text-sm text-slate-500">
                                                                            {feeCategory.remaining_slots === null
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

                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="text-sm text-slate-500">
                                                            Total event capacity: <span className="font-semibold text-slate-900">{event.total_capacity}</span>
                                                        </div>
                                                        <Button asChild className="h-11 rounded-xl bg-[#184d47] px-5 text-white hover:bg-[#143f3a]">
                                                            <Link href={primaryActionHref}>
                                                                {primaryActionLabel}
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm font-semibold tracking-[0.2em] text-[#184d47] uppercase">
                                    Registration guide
                                </p>
                                <h2 className="text-3xl font-bold tracking-[-0.04em]">
                                    Frequently asked questions
                                </h2>
                                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                                    A quick guide for church representatives using the online registration flow.
                                </p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
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
                </div>
            </div>
        </>
    );
}
