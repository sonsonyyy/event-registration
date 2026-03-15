import { Link, useForm } from '@inertiajs/react';
import { Building2, Plus, ReceiptText, Trash2, UsersRound } from 'lucide-react';
import type { FormEvent } from 'react';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    formatSystemDateOnly,
    formatSystemDateTime,
} from '@/lib/date-time';

type FeeCategoryOption = {
    id: number;
    category_name: string;
    amount: string;
    slot_limit: number | null;
    remaining_slots: number | null;
};

type EventOption = {
    id: number;
    name: string;
    venue: string;
    date_from: string;
    date_to: string;
    registration_close_at: string;
    remaining_slots: number;
    fee_categories: FeeCategoryOption[];
};

type PastorOption = {
    id: number;
    pastor_name: string;
    church_name: string;
    section_id: number;
    section_name: string;
    district_id: number;
    district_name: string;
};

type SectionOption = {
    id: number;
    name: string;
    district_id: number;
    district_name: string;
};

type SelectOption = {
    value: string;
    label: string;
};

type LineItemFormValue = {
    fee_category_id: string;
    quantity: string;
};

type OnsiteRegistrationFormData = {
    event_id: string;
    district_id: string;
    section_id: string;
    pastor_id: string;
    payment_status: string;
    payment_reference: string;
    remarks: string;
    line_items: LineItemFormValue[];
};

type Props = {
    events: EventOption[];
    pastors: PastorOption[];
    paymentStatusOptions: SelectOption[];
};

const textareaClassName =
    'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';
const summaryCardClassName =
    'rounded-[24px] border px-5 py-5 shadow-sm transition-colors';

const formatCurrency = (value: number | string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(typeof value === 'string' ? Number.parseFloat(value || '0') : value);

const formatDate = (value: string): string => formatSystemDateTime(value);

const formatEventDate = (value: string): string => formatSystemDateOnly(value);

function emptyLineItem(): LineItemFormValue {
    return {
        fee_category_id: '',
        quantity: '',
    };
}

export default function OnsiteRegistrationForm({
    events,
    pastors,
    paymentStatusOptions,
}: Props) {
    const form = useForm<OnsiteRegistrationFormData>({
        event_id: events[0]?.id.toString() ?? '',
        district_id: '',
        section_id: '',
        pastor_id: '',
        payment_status:
            paymentStatusOptions.find((option) => option.value === 'unpaid')
                ?.value ??
            paymentStatusOptions[0]?.value ??
            '',
        payment_reference: '',
        remarks: '',
        line_items: [emptyLineItem()],
    });
    const selectedEvent =
        events.find((event) => event.id.toString() === form.data.event_id) ??
        null;
    const selectedPastor =
        pastors.find((pastor) => pastor.id.toString() === form.data.pastor_id) ??
        null;
    const availableFeeCategories = selectedEvent?.fee_categories ?? [];
    const sectionOptions = Array.from(
        new Map(
            pastors.map((pastor) => [
                pastor.section_id,
                {
                    id: pastor.section_id,
                    name: pastor.section_name,
                    district_id: pastor.district_id,
                    district_name: pastor.district_name,
                },
            ]),
        ).values(),
    ).sort((left, right) => left.name.localeCompare(right.name));
    const filteredPastors = form.data.section_id
        ? pastors.filter(
              (pastor) =>
                  pastor.section_id.toString() === form.data.section_id,
          )
        : pastors;

    let totalQuantity = 0;
    let totalAmount = 0;

    form.data.line_items.forEach((lineItem) => {
        const quantity = Number.parseInt(lineItem.quantity || '0', 10);

        if (Number.isNaN(quantity) || quantity <= 0) {
            return;
        }

        totalQuantity += quantity;

        const feeCategory = availableFeeCategories.find(
            (category) =>
                category.id.toString() === lineItem.fee_category_id,
        );

        if (feeCategory) {
            totalAmount += quantity * Number.parseFloat(feeCategory.amount);
        }
    });

    const setEvent = (eventId: string): void => {
        form.setData((currentData) => ({
            ...currentData,
            event_id: eventId,
            line_items: [emptyLineItem()],
        }));
    };

    const changeSection = (value: string): void => {
        const section = sectionOptions.find(
            (option) => option.id.toString() === value,
        );
        const nextPastor = pastors.find(
            (pastor) =>
                pastor.id.toString() === form.data.pastor_id &&
                pastor.section_id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            district_id:
                section?.district_id.toString() ?? currentData.district_id,
            section_id: value,
            pastor_id: nextPastor?.id.toString() ?? '',
        }));
    };

    const changePastor = (value: string): void => {
        const pastor = pastors.find(
            (option) => option.id.toString() === value,
        );

        form.setData((currentData) => ({
            ...currentData,
            district_id:
                pastor?.district_id.toString() ?? currentData.district_id,
            section_id:
                pastor?.section_id.toString() ?? currentData.section_id,
            pastor_id: value,
        }));
    };

    const updateLineItem = (
        index: number,
        field: keyof LineItemFormValue,
        value: string,
    ): void => {
        form.setData(
            'line_items',
            form.data.line_items.map((lineItem, lineItemIndex) =>
                lineItemIndex === index
                    ? {
                          ...lineItem,
                          [field]: value,
                      }
                    : lineItem,
            ),
        );
    };

    const addLineItem = (): void => {
        form.setData('line_items', [...form.data.line_items, emptyLineItem()]);
    };

    const removeLineItem = (index: number): void => {
        form.setData(
            'line_items',
            form.data.line_items.filter(
                (_, lineItemIndex) => lineItemIndex !== index,
            ),
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.submit(OnsiteRegistrationController.store(), {
            preserveScroll: true,
        });
    };

    return (
        <form className="space-y-8" onSubmit={submit}>
            <div className="space-y-6">
                <div className="grid gap-6">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
                        <div className="flex h-full flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="event_id">Event</Label>
                                <select
                                    id="event_id"
                                    name="event_id"
                                    value={form.data.event_id}
                                    onChange={(event) =>
                                        setEvent(event.target.value)
                                    }
                                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                    disabled={events.length === 0}
                                >
                                    <option value="">Select an event</option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.name} · {event.remaining_slots} slots
                                            {' '}left
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.event_id} />
                            </div>

                            <div className="grid gap-6 xl:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="section_id">Section</Label>
                                    <select
                                        id="section_id"
                                        name="section_id"
                                        value={form.data.section_id}
                                        onChange={(event) =>
                                            changeSection(event.target.value)
                                        }
                                        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                    >
                                        <option value="">Select a section</option>
                                        {sectionOptions.map((section) => (
                                            <option key={section.id} value={section.id}>
                                                {section.name} · {section.district_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="pastor_id">Pastor or church</Label>
                                    <select
                                        id="pastor_id"
                                        name="pastor_id"
                                        value={form.data.pastor_id}
                                        onChange={(event) =>
                                            changePastor(event.target.value)
                                        }
                                        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                        disabled={pastors.length === 0}
                                    >
                                        <option value="">Select a pastor or church</option>
                                        {filteredPastors.map((pastor) => (
                                            <option key={pastor.id} value={pastor.id}>
                                                {pastor.church_name} · {pastor.pastor_name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={form.errors.pastor_id} />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[28px] border border-[#184d47]/20 bg-[#184d47] px-5 py-5 text-white shadow-sm shadow-[#184d47]/20">
                            <div className="flex h-full flex-col justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">
                                        Event availability
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {selectedEvent?.name ?? 'Choose an event'}
                                    </div>
                                </div>

                                {selectedEvent ? (
                                    <div className="space-y-4 border-t border-white/10 pt-4 text-sm">
                                        <div className="space-y-1">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                                                Venue
                                            </div>
                                            <div className="font-semibold text-white">
                                                {selectedEvent.venue}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                                                Event dates
                                            </div>
                                            <div className="font-semibold text-white">
                                                {formatEventDate(selectedEvent.date_from)} to{' '}
                                                {formatEventDate(selectedEvent.date_to)}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                                                Remaining slots
                                            </div>
                                            <div className="font-semibold text-white">
                                                {selectedEvent.remaining_slots} slots available
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                                                Registration closes
                                            </div>
                                            <div className="font-semibold text-white">
                                                {formatDate(selectedEvent.registration_close_at)}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-t border-white/10 pt-4 text-sm text-white/75">
                                        Choose an event from the dropdown to review its venue, schedule, and available slots before adding your registration items.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="payment_status">Payment status</Label>
                            <select
                                id="payment_status"
                                name="payment_status"
                                value={form.data.payment_status}
                                onChange={(event) =>
                                    form.setData(
                                        'payment_status',
                                        event.target.value,
                                    )
                                }
                                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            >
                                {paymentStatusOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.payment_status} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="payment_reference">
                                Official receipt / reference
                            </Label>
                            <Input
                                id="payment_reference"
                                name="payment_reference"
                                value={form.data.payment_reference}
                                onChange={(event) =>
                                    form.setData(
                                        'payment_reference',
                                        event.target.value,
                                    )
                                }
                                placeholder="OR-2026-00123"
                            />
                            <InputError message={form.errors.payment_reference} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <textarea
                            id="remarks"
                            name="remarks"
                            value={form.data.remarks}
                            onChange={(event) =>
                                form.setData('remarks', event.target.value)
                            }
                            placeholder="Optional notes for this transaction."
                            className={textareaClassName}
                        />
                        <InputError message={form.errors.remarks} />
                    </div>
                </div>
            </div>

            <section className="space-y-4 border-t border-sidebar-border/70 pt-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold tracking-tight">
                            Line items
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Add one or more fee categories with their
                            corresponding quantities.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={addLineItem}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add item
                    </Button>
                </div>

                {form.data.line_items.map((lineItem, index) => {
                        const selectedFeeCategory =
                            availableFeeCategories.find(
                                (feeCategory) =>
                                    feeCategory.id.toString() ===
                                    lineItem.fee_category_id,
                            ) ?? null;

                        return (
                            <div
                                key={index}
                                className="rounded-xl border border-sidebar-border/70 bg-background p-4"
                            >
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_auto]">
                                    <div className="grid gap-2">
                                        <Label htmlFor={`fee_category_${index}`}>
                                            Fee category
                                        </Label>
                                        <select
                                            id={`fee_category_${index}`}
                                            name={`line_items.${index}.fee_category_id`}
                                            value={lineItem.fee_category_id}
                                            onChange={(event) =>
                                                updateLineItem(
                                                    index,
                                                    'fee_category_id',
                                                    event.target.value,
                                                )
                                            }
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                            disabled={selectedEvent === null}
                                        >
                                            <option value="">
                                                {selectedEvent
                                                    ? 'Select a fee category'
                                                    : 'Select an event first'}
                                            </option>
                                            {availableFeeCategories.map(
                                                (feeCategory) => (
                                                    <option
                                                        key={feeCategory.id}
                                                        value={feeCategory.id}
                                                    >
                                                        {feeCategory.category_name}{' '}
                                                        ·{' '}
                                                        {formatCurrency(
                                                            feeCategory.amount,
                                                        )}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <InputError
                                            message={
                                                form.errors[
                                                    `line_items.${index}.fee_category_id`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor={`quantity_${index}`}>
                                            Quantity
                                        </Label>
                                        <Input
                                            id={`quantity_${index}`}
                                            name={`line_items.${index}.quantity`}
                                            type="number"
                                            min="1"
                                            value={lineItem.quantity}
                                            onChange={(event) =>
                                                updateLineItem(
                                                    index,
                                                    'quantity',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="0"
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    `line_items.${index}.quantity`
                                                ]
                                            }
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => removeLineItem(index)}
                                            disabled={
                                                form.data.line_items.length === 1
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>

                                {selectedFeeCategory && (
                                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                                        <Badge variant="default">
                                            {formatCurrency(
                                                selectedFeeCategory.amount,
                                            )}{' '}
                                            each
                                        </Badge>
                                        <Badge
                                            variant={
                                                selectedFeeCategory.remaining_slots ===
                                                null
                                                    ? 'default'
                                                    : selectedFeeCategory.remaining_slots >
                                                          0
                                                      ? 'secondary'
                                                      : 'destructive'
                                            }
                                        >
                                            {selectedFeeCategory.remaining_slots ===
                                            null
                                                ? 'No category slot limit'
                                                : `${selectedFeeCategory.remaining_slots} category slots left`}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <InputError message={form.errors.line_items} />
            </section>

            <section className="space-y-4 border-t border-sidebar-border/70 pt-8">
                <div className="space-y-1">
                    <h3 className="text-base font-semibold tracking-tight">
                        Transaction summary
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        One receipt can cover multiple fee-category quantities in
                        the same onsite transaction.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className={`${summaryCardClassName} border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(24,77,71,0.10),_rgba(255,255,255,0.98))] shadow-[#184d47]/8`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-medium text-slate-600">
                                Selected church
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#184d47] text-white shadow-sm shadow-[#184d47]/15">
                                <Building2 className="size-[18px]" />
                            </div>
                        </div>
                        <div className="mt-5 text-lg font-semibold text-slate-900">
                            {selectedPastor?.church_name ?? 'No church selected'}
                        </div>
                        <div className="mt-2 text-sm text-slate-600">
                            {selectedPastor
                                ? `${selectedPastor.pastor_name} · ${selectedPastor.section_name}`
                                : 'Choose a pastor or church to continue.'}
                        </div>
                    </div>

                    <div className={`${summaryCardClassName} border-[#dfe4e8] bg-[linear-gradient(145deg,_rgba(248,250,252,0.96),_rgba(255,255,255,1))] shadow-slate-200/70`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-medium text-slate-600">
                                Total quantity
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-300/70">
                                <UsersRound className="size-[18px]" />
                            </div>
                        </div>
                        <div className="mt-5 text-3xl font-semibold text-slate-900">
                            {totalQuantity}
                        </div>
                        <div className="mt-2 text-sm text-slate-600">
                            Across {form.data.line_items.length} fee-category
                            item
                            {form.data.line_items.length === 1 ? '' : 's'}
                        </div>
                    </div>

                    <div className={`${summaryCardClassName} border-[#184d47]/20 bg-[#184d47] text-white shadow-[#184d47]/20`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-medium text-white/75">
                                Estimated total
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-white/14 text-white ring-1 ring-white/15">
                                <ReceiptText className="size-[18px]" />
                            </div>
                        </div>
                        <div className="mt-5 text-3xl font-semibold">
                            {formatCurrency(totalAmount)}
                        </div>
                        <div className="mt-2 text-sm text-white/75">
                            Computed from the selected fee category rates.
                        </div>
                    </div>
                </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                    <Link href={OnsiteRegistrationController.index()}>
                        Cancel
                    </Link>
                </Button>
                <Button
                    type="submit"
                    disabled={
                        form.processing || events.length === 0 || pastors.length === 0
                    }
                >
                    {form.processing && <Spinner />}
                    Save onsite registration
                </Button>
            </div>
        </form>
    );
}
